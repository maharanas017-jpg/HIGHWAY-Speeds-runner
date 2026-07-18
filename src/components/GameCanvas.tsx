/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { PlayerStats, GameSettings, EnvironmentType } from '../types';
import { sound } from '../sound';
import { Zap, Shield, Sparkles, Magnet, Play, RefreshCw, Volume2, VolumeX, AlertTriangle, Eye, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GameCanvasProps {
  stats: PlayerStats;
  settings: GameSettings;
  selectedLevel?: EnvironmentType | 'all';
  onUpdateStats: (newStats: PlayerStats) => void;
  onGameOver: (finalScore: number, finalDist: number) => void;
  onBackToMenu: () => void;
}

// ----------------------------------------------------
// Core Math & Configuration for Pseudo-3D Road Engine
// ----------------------------------------------------
const ROAD_SEGMENT_LENGTH = 150; // length of each segment
const VISIBLE_SEGMENTS = 250; // visible view horizon distance
const ROAD_WIDTH = 2000;
const LANES_COUNT = 3;

interface Sprite {
  offset: number; // horizontal offset from center (-1.5 to 1.5)
  type: string; // 'tree', 'rock', 'sign', 'building', 'cactus', 'car', 'truck', 'bus', 'coin', 'gem', 'shield', 'nitro', 'magnet', 'booster', 'repair', 'cone', 'barrier', 'log'
  z: number; // relative segment Z position
  scale?: number;
  speed?: number; // for dynamic traffic cars
  color?: string; // for traffic cars
  collected?: boolean;
}

interface RoadSegment {
  index: number;
  p1: { x: number; y: number; z: number; screenX: number; screenY: number; screenW: number };
  p2: { x: number; y: number; z: number; screenX: number; screenY: number; screenW: number };
  curve: number;
  hill: number;
  environment: EnvironmentType;
  color: { road: string; grass: string; rumble: string; lanes: string };
  sprites: Sprite[];
}

// Environment theme definitions
const ENV_THEMES: Record<EnvironmentType, {
  skyGrad: string[];
  fogColor: string;
  roadColor: string;
  grassColor: string;
  grassAlternate: string;
  rumbleColor: string;
  sceneryTypes: string[];
}> = {
  jungle: {
    skyGrad: ['#042f1a', '#064e3b', '#0f766e'],
    fogColor: '#0f766e',
    roadColor: '#2d3748',
    grassColor: '#14532d',
    grassAlternate: '#166534',
    rumbleColor: '#e11d48',
    sceneryTypes: ['jungle_tree', 'palm_tree', 'tropical_flower', 'sign_warn'],
  },
  mountain: {
    skyGrad: ['#0f172a', '#1e293b', '#475569'],
    fogColor: '#94a3b8',
    roadColor: '#334155',
    grassColor: '#cbd5e1', // Snow
    grassAlternate: '#e2e8f0',
    rumbleColor: '#2563eb',
    sceneryTypes: ['snowy_pine', 'rock_boulder', 'frozen_rock'],
  },
  city: {
    skyGrad: ['#1e1b4b', '#311042', '#111827'],
    fogColor: '#111827',
    roadColor: '#1f2937',
    grassColor: '#064e3b',
    grassAlternate: '#022c22',
    rumbleColor: '#eab308',
    sceneryTypes: ['skyscraper_1', 'skyscraper_2', 'street_lamp', 'billboard_ad'],
  },
  desert: {
    skyGrad: ['#7c2d12', '#9a3412', '#ea580c'],
    fogColor: '#ea580c',
    roadColor: '#374151',
    grassColor: '#f59e0b', // Sand
    grassAlternate: '#d97706',
    rumbleColor: '#9a3412',
    sceneryTypes: ['cactus_tall', 'cactus_round', 'desert_rock', 'dead_tree'],
  },
  rainy: {
    skyGrad: ['#0f172a', '#1e293b', '#334155'],
    fogColor: '#475569',
    roadColor: '#111827', // darker wet road
    grassColor: '#064e3b',
    grassAlternate: '#022c22',
    rumbleColor: '#dc2626',
    sceneryTypes: ['jungle_tree', 'rock_boulder', 'sign_warn'],
  },
  night: {
    skyGrad: ['#020617', '#030712', '#090d16'],
    fogColor: '#030712',
    roadColor: '#111827',
    grassColor: '#020617',
    grassAlternate: '#030712',
    rumbleColor: '#1e293b',
    sceneryTypes: ['street_lamp', 'silhouette_tree', 'billboard_ad'],
  },
};

export default function GameCanvas({ stats, settings, selectedLevel = 'all', onUpdateStats, onGameOver, onBackToMenu }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game Play Engine states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [countdown, setCountdown] = useState<number | string>(3);
  const [health, setHealth] = useState(100);
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [coinsInRun, setCoinsInRun] = useState(0);
  const [currentEnv, setCurrentEnv] = useState<EnvironmentType>('jungle');

  // Booster durations left (in frames/seconds)
  const [activeShield, setActiveShield] = useState(0); // in s
  const [activeNitro, setActiveNitro] = useState(0); // in s
  const [activeMagnet, setActiveMagnet] = useState(0); // in s
  const [activeCoinBooster, setActiveCoinBooster] = useState(0); // in s

  // Inventory available to tap and use during gameplay
  const [inventory, setInventory] = useState(stats.inventory);

  // Crash flash screen trigger
  const [flashRed, setFlashRed] = useState(false);

  // Screen orientation / Portrait simulation state (Rotret)
  const [isPortrait, setIsPortrait] = useState(false);

  // Monetization Ad overlays
  const [showRewardedAd, setShowRewardedAd] = useState(false);
  const [rewardedAdTimer, setRewardedAdTimer] = useState(5);
  const [showInterstitialAd, setShowInterstitialAd] = useState(false);

  // Engine core gameplay properties (Z, X, velocity)
  const engineRef = useRef({
    playerX: 0, // car horizontal offset (-1.0 to 1.0)
    playerZ: 0, // car total distance Z
    speed: 0, // current speed (m/s)
    maxSpeed: 1600, // sports car max speed
    accel: 25,
    decel: -35,
    roadSegments: [] as RoadSegment[],
    skyOffset: 0,
    roadTotalZ: 0,
    keys: { left: false, right: false, up: false, down: false },
    particles: [] as Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number; size: number; alpha: number }>,
    weatherParticles: [] as Array<{ x: number; y: number; speed: number; length: number; angle: number }>,
    obstaclesAvoidedThisRun: 0,
    totalCoinsCollectedThisRun: 0,
    lastFrameTime: 0,
    animationFrameId: 0,
  });

  const activeCarConfig = React.useMemo(() => {
    return stats.activeCar === 'suv' ? { speed: 5, handling: 6, max: 1300, color: '#faba13' }
         : stats.activeCar === 'muscle' ? { speed: 7, handling: 5, max: 1750, color: '#00cc66' }
         : stats.activeCar === 'police' ? { speed: 8, handling: 8, max: 1850, color: '#0f172a' }
         : stats.activeCar === 'super' ? { speed: 9, handling: 9, max: 2100, color: '#06b6d4' }
         : stats.activeCar === 'formula' ? { speed: 10, handling: 10, max: 2400, color: '#c084fc' }
         : { speed: 6, handling: 7, max: 1550, color: '#ff2a2a' }; // sports
  }, [stats.activeCar]);

  // Handle swipe gestures on mobile
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // ----------------------------------------------------
  // Initialization of the 3D road tracks & assets
  // ----------------------------------------------------
  const buildRoad = () => {
    const segments: RoadSegment[] = [];
    const numSegments = 600; // loop track segments
    
    // Procedural track drawing
    for (let i = 0; i < numSegments; i++) {
      let curve = 0;
      let hill = 0;
      
      // Dynamic curves
      if (i > 60 && i < 110) curve = 2.5; // right curve
      if (i > 150 && i < 220) curve = -3.2; // deep left curve
      if (i > 270 && i < 330) curve = 1.8;
      if (i > 380 && i < 440) curve = -2.0;
      if (i > 480 && i < 540) curve = 4.0; // extreme curve

      // Dynamic hills
      if (i > 100 && i < 180) hill = Math.sin((i - 100) / 10) * 120; // undulating hills
      if (i > 300 && i < 380) hill = Math.cos((i - 300) / 15) * 200; // large crest
      if (i > 420 && i < 500) hill = Math.sin((i - 420) / 12) * -150; // valley

      // Alternate environments per segment block for transitions or use selected level
      let segmentEnv: EnvironmentType = 'jungle';
      if (selectedLevel && selectedLevel !== 'all') {
        segmentEnv = selectedLevel;
      } else {
        if (i >= 100 && i < 200) segmentEnv = 'mountain';
        else if (i >= 200 && i < 300) segmentEnv = 'city';
        else if (i >= 300 && i < 400) segmentEnv = 'desert';
        else if (i >= 400 && i < 500) segmentEnv = 'rainy';
        else if (i >= 500) segmentEnv = 'night';
      }

      const theme = ENV_THEMES[segmentEnv];

      // Procedural obstacle/collectible distribution
      const segmentSprites: Sprite[] = [];
      const zOffset = i * ROAD_SEGMENT_LENGTH;

      // Add decorations on sides of the road
      if (i % 3 === 0) {
        const sideOffset = Math.random() > 0.5 ? 1.6 : -1.6;
        const typeIdx = Math.floor(Math.random() * theme.sceneryTypes.length);
        segmentSprites.push({
          offset: sideOffset * (1.1 + Math.random() * 0.5),
          type: theme.sceneryTypes[typeIdx],
          z: zOffset + Math.random() * ROAD_SEGMENT_LENGTH,
          scale: 1.5 + Math.random() * 0.8
        });
      }

      // Add coins, powerups, and obstacles in lanes
      if (i > 20) {
        // 1. Spawn dynamic running traffic cars with exciting speeds
        if (i % 7 === 0) {
          const spawnTrafficRng = Math.random();
          if (spawnTrafficRng < 0.70) {
            const laneX = Math.floor(Math.random() * 3) - 1; // Left, Center, Right lane
            const obsType = ['car', 'truck', 'bus'][Math.floor(Math.random() * 3)];
            
            // Random speeds - cars are faster, trucks are slower
            const trafficSpeed = obsType === 'car' ? 150 + Math.random() * 150 
                               : obsType === 'bus' ? 120 + Math.random() * 50 
                               : 80 + Math.random() * 40; // in units per second

            segmentSprites.push({
              offset: laneX * 0.65,
              type: obsType,
              z: zOffset + Math.random() * ROAD_SEGMENT_LENGTH,
              speed: trafficSpeed,
              color: ['#dc2626', '#16a34a', '#2563eb', '#9333ea', '#eab308'][Math.floor(Math.random() * 5)]
            });
          }
        }

        // 2. Spawn Coins and Collectibles separately (every 4 segments)
        if (i % 4 === 0) {
          const spawnItemRng = Math.random();
          const laneX = Math.floor(Math.random() * 3) - 1;
          
          if (spawnItemRng < 0.55) {
            // Coins
            segmentSprites.push({
              offset: laneX * 0.65,
              type: 'coin',
              z: zOffset + Math.random() * ROAD_SEGMENT_LENGTH
            });
          } else if (spawnItemRng < 0.72) {
            // Powerups / Gems
            const colType = Math.random() > 0.65
              ? ['shield', 'nitro', 'magnet', 'booster', 'repair'][Math.floor(Math.random() * 5)]
              : 'gem';
            
            segmentSprites.push({
              offset: laneX * 0.65,
              type: colType,
              z: zOffset + Math.random() * ROAD_SEGMENT_LENGTH
            });
          }
        }

        // 3. Spawn static road hazards (every 12 segments)
        if (i % 12 === 0) {
          const spawnHazardRng = Math.random();
          if (spawnHazardRng < 0.60) {
            const laneX = Math.floor(Math.random() * 3) - 1;
            const hazType = ['cone', 'barrier', 'log', 'rock_boulder'][Math.floor(Math.random() * 4)];
            segmentSprites.push({
              offset: laneX * 0.65,
              type: hazType,
              z: zOffset + Math.random() * ROAD_SEGMENT_LENGTH
            });
          }
        }
      }

      // Base colors
      const isEven = Math.floor(i / 3) % 2 === 0;
      const themeColors = {
        road: isEven ? theme.roadColor : '#1e293b',
        grass: isEven ? theme.grassColor : theme.grassAlternate,
        rumble: isEven ? theme.rumbleColor : '#ffffff',
        lanes: isEven ? '#ffffff' : 'transparent',
      };

      segments.push({
        index: i,
        p1: { x: 0, y: 0, z: zOffset, screenX: 0, screenY: 0, screenW: 0 },
        p2: { x: 0, y: 0, z: zOffset + ROAD_SEGMENT_LENGTH, screenX: 0, screenY: 0, screenW: 0 },
        curve,
        hill,
        environment: segmentEnv,
        color: themeColors,
        sprites: segmentSprites
      });
    }

    engineRef.current.roadSegments = segments;
    engineRef.current.roadTotalZ = numSegments * ROAD_SEGMENT_LENGTH;
    engineRef.current.maxSpeed = activeCarConfig.max;
  };

  // Setup dynamic weather particles
  const generateWeatherParticles = (width: number, height: number) => {
    const particles = [];
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 10 + Math.random() * 15,
        length: 8 + Math.random() * 12,
        angle: Math.PI / 2 + (Math.random() * 0.2 - 0.1) // slightly diagonal
      });
    }
    engineRef.current.weatherParticles = particles;
  };

  // ----------------------------------------------------
  // Trigger Powerup Booster Effects
  // ----------------------------------------------------
  const usePowerUp = (type: 'shield' | 'nitro' | 'magnet' | 'coinBooster') => {
    if (inventory[type] <= 0) return;

    sound.playBoost();

    // Consume inventory count
    const updatedInv = { ...inventory, [type]: inventory[type] - 1 };
    setInventory(updatedInv);
    onUpdateStats({ ...stats, inventory: updatedInv });

    if (type === 'shield') {
      setActiveShield(12);
    } else if (type === 'nitro') {
      setActiveNitro(6);
      engineRef.current.speed = engineRef.current.maxSpeed * 1.5; // nitro hyper boost speed
    } else if (type === 'magnet') {
      setActiveMagnet(15);
    } else if (type === 'coinBooster') {
      setActiveCoinBooster(15);
    }
  };

  // Key Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || isPaused) return;
      const k = engineRef.current.keys;
      if (e.key === 'ArrowLeft' || e.key === 'a') k.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') k.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w') k.up = true;
      if (e.key === 'ArrowDown' || e.key === 's') k.down = true;

      // Tap horn on Space
      if (e.key === ' ') {
        sound.playHorn();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = engineRef.current.keys;
      if (e.key === 'ArrowLeft' || e.key === 'a') k.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') k.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w') k.up = false;
      if (e.key === 'ArrowDown' || e.key === 's') k.down = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, isPaused]);

  // Steer left button touch press handler
  const startSteerLeft = () => { engineRef.current.keys.left = true; };
  const stopSteerLeft = () => { engineRef.current.keys.left = false; };
  const startSteerRight = () => { engineRef.current.keys.right = true; };
  const stopSteerRight = () => { engineRef.current.keys.right = false; };

  // Swipe logic for mobiles
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const t = e.touches[0];
    const diffX = t.clientX - touchStartRef.current.x;
    
    // Swipe horizontal lane shift
    if (Math.abs(diffX) > 40) {
      if (diffX < 0) {
        // swipe left: steer left briefly
        engineRef.current.keys.left = true;
        setTimeout(() => { engineRef.current.keys.left = false; }, 180);
      } else {
        // swipe right: steer right briefly
        engineRef.current.keys.right = true;
        setTimeout(() => { engineRef.current.keys.right = false; }, 180);
      }
      touchStartRef.current = null; // consume
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  // ----------------------------------------------------
  // Core Countdown & Launch Loop
  // ----------------------------------------------------
  useEffect(() => {
    buildRoad();
    // Start countdown
    let timer = 3;
    sound.playCoin();
    const interval = setInterval(() => {
      timer -= 1;
      if (timer === 0) {
        setCountdown('GO!');
        sound.playBoost();
      } else if (timer < 0) {
        clearInterval(interval);
        setIsPlaying(true);
        sound.startMusic();
        sound.startEngine();
      } else {
        setCountdown(timer);
        sound.playCoin();
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      sound.stopMusic();
      sound.stopEngine();
    };
  }, []);

  // Countdown timer decrement for boosters
  useEffect(() => {
    if (!isPlaying || isPaused) return;
    const interval = setInterval(() => {
      setActiveShield((prev) => Math.max(0, prev - 1));
      setActiveNitro((prev) => Math.max(0, prev - 1));
      setActiveMagnet((prev) => Math.max(0, prev - 1));
      setActiveCoinBooster((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, isPaused]);

  // Handle game pausing
  const handlePauseToggle = () => {
    sound.playCoin();
    if (isPaused) {
      sound.startMusic();
      sound.startEngine();
      setIsPaused(false);
    } else {
      sound.stopMusic();
      sound.stopEngine();
      setIsPaused(true);
    }
  };

  // Reset core run parameters for a complete restart
  const handleRestart = () => {
    sound.playCoin();
    setHealth(100);
    setScore(0);
    setDistance(0);
    setCoinsInRun(0);
    setActiveShield(0);
    setActiveNitro(0);
    setActiveMagnet(0);
    setActiveCoinBooster(0);
    setInventory(stats.inventory);
    engineRef.current.playerX = 0;
    engineRef.current.playerZ = 0;
    engineRef.current.speed = 0;
    engineRef.current.obstaclesAvoidedThisRun = 0;
    engineRef.current.totalCoinsCollectedThisRun = 0;
    setIsPaused(false);
    
    // Clear and build new road
    buildRoad();
    
    // Resume audio
    sound.stopMusic();
    sound.stopEngine();
    sound.startMusic();
    sound.startEngine();
  };

  // ----------------------------------------------------
  // Interactive Engine Tick & Render Loop
  // ----------------------------------------------------
  useEffect(() => {
    if (!isPlaying || isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Responsive sizing
    const handleResize = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      generateWeatherParticles(rect.width, rect.height);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    let animationFrameId: number;

    const loop = (timestamp: number) => {
      if (!engineRef.current.lastFrameTime) {
        engineRef.current.lastFrameTime = timestamp;
      }
      const dt = Math.min(0.1, (timestamp - engineRef.current.lastFrameTime) / 1000);
      engineRef.current.lastFrameTime = timestamp;

      updateGame(dt, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
      renderGame(ctx, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isPlaying, isPaused, activeShield, activeNitro, activeMagnet, activeCoinBooster]);

  // ----------------------------------------------------
  // Physics & Mechanics Updates
  // ----------------------------------------------------
  const updateGame = (dt: number, width: number, height: number) => {
    const eng = engineRef.current;
    
    // 1. Speeds & Decelerations
    const keys = eng.keys;
    const isBraking = keys.down;
    
    // Apply speed modifiers
    const isNitroActive = activeNitro > 0;
    const targetMaxSpeed = isNitroActive ? eng.maxSpeed * 1.5 : eng.maxSpeed;
    const isAcceleratingFast = keys.up;

    if (isNitroActive || isAcceleratingFast) {
      // High-performance maximum acceleration
      eng.speed += eng.accel * 55 * dt;
    } else if (isBraking) {
      // Heavy active braking / slowing down
      eng.speed += eng.decel * 110 * dt;
    } else {
      // Comfortable automatic cruising at 75% capacity
      const cruisingTarget = targetMaxSpeed * 0.75;
      if (eng.speed < cruisingTarget) {
        eng.speed += eng.accel * 25 * dt;
      } else if (eng.speed > cruisingTarget) {
        eng.speed += eng.decel * 20 * dt;
      }
    }

    // Hard clamps on speeds
    eng.speed = Math.max(0, Math.min(targetMaxSpeed, eng.speed));

    // Update Web Audio API engine pitch relative to speed
    sound.updateMuteStates(settings.soundOn, settings.musicOn);
    sound.updateEngine(eng.speed / eng.maxSpeed);

    // 2. Steer mechanics
    const handlingFactor = activeCarConfig.handling;
    const steeringForce = 1.6 + (handlingFactor * 0.1);
    
    if (keys.left) {
      eng.playerX -= steeringForce * dt * (eng.speed / eng.maxSpeed + 0.3);
      // Spawn dust/tire smoke particles
      if (eng.speed > 500) {
        eng.particles.push({
          x: width / 2 - 40,
          y: height - 60,
          vx: -150 - Math.random() * 100,
          vy: -30 - Math.random() * 50,
          color: currentEnv === 'desert' ? '#f59e0b' : '#ffffff',
          life: 0.4,
          size: 4 + Math.random() * 4,
          alpha: 0.6
        });
      }
    }
    if (keys.right) {
      eng.playerX += steeringForce * dt * (eng.speed / eng.maxSpeed + 0.3);
      // Spawn smoke
      if (eng.speed > 500) {
        eng.particles.push({
          x: width / 2 + 40,
          y: height - 60,
          vx: 150 + Math.random() * 100,
          vy: -30 - Math.random() * 50,
          color: currentEnv === 'desert' ? '#f59e0b' : '#ffffff',
          life: 0.4,
          size: 4 + Math.random() * 4,
          alpha: 0.6
        });
      }
    }

    // Keep car clamped on road limits
    eng.playerX = Math.max(-1.8, Math.min(1.8, eng.playerX));

    // 3. Move camera along world Z path
    eng.playerZ += eng.speed * dt;
    if (eng.playerZ >= eng.roadTotalZ) {
      eng.playerZ -= eng.roadTotalZ; // endless wrap around track
    }

    // 3.5. Update running traffic sprites along the endless track
    const roadTotalZ = eng.roadTotalZ;
    const movingSprites: Sprite[] = [];
    
    // Extract all moving sprites from their current segments
    eng.roadSegments.forEach((seg) => {
      const remaining: Sprite[] = [];
      seg.sprites.forEach((sp) => {
        if (sp.speed && sp.speed > 0) {
          movingSprites.push(sp);
        } else {
          remaining.push(sp);
        }
      });
      seg.sprites = remaining;
    });

    // Advance Z coordinate for all moving vehicles and re-insert into the updated segment
    movingSprites.forEach((sp) => {
      sp.z += sp.speed * dt;
      if (sp.z >= roadTotalZ) {
        sp.z -= roadTotalZ;
        sp.collected = false; // Reset collected flag upon wrapping around track
      } else if (sp.z < 0) {
        sp.z += roadTotalZ;
      }

      const newSegIndex = Math.floor(sp.z / ROAD_SEGMENT_LENGTH) % eng.roadSegments.length;
      const targetSeg = eng.roadSegments[newSegIndex];
      if (targetSeg) {
        targetSeg.sprites.push(sp);
      } else {
        eng.roadSegments[0].sprites.push(sp);
      }
    });

    // Update real time run metrics
    const currentMeters = Math.floor(eng.playerZ / 100) + (distance > 0 ? 0 : 0);
    setDistance((prev) => prev + Math.floor(eng.speed * dt * 0.05));
    
    // Scale scoreboard
    const basePtsGained = Math.floor(eng.speed * dt * 0.01);
    const scoreMultiplier = activeCoinBooster > 0 ? 2 : 1;
    setScore((prev) => prev + basePtsGained * scoreMultiplier);

    // Track particles life cycle
    eng.particles.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / 0.4);
    });
    eng.particles = eng.particles.filter((p) => p.life > 0);

    // Weather particles rendering updates
    const isRain = currentEnv === 'rainy';
    const isSnow = currentEnv === 'mountain';
    if (isRain || isSnow) {
      eng.weatherParticles.forEach((wp) => {
        wp.y += wp.speed * dt * 60;
        wp.x += Math.sin(wp.y / 20) * (isSnow ? 1 : 0.2); // drifting snow
        if (wp.y > height) {
          wp.y = 0;
          wp.x = Math.random() * width;
        }
      });
    }

    // 4. Collision and Collectible checking
    const currentSegIndex = Math.floor(eng.playerZ / ROAD_SEGMENT_LENGTH);
    const targetSegment = eng.roadSegments[currentSegIndex % eng.roadSegments.length];
    
    if (targetSegment) {
      setCurrentEnv(targetSegment.environment);

      // Inspect sprites on current and nearby active segments
      const checkSegments = [
        eng.roadSegments[(currentSegIndex) % eng.roadSegments.length],
        eng.roadSegments[(currentSegIndex + 1) % eng.roadSegments.length],
        eng.roadSegments[(currentSegIndex + 2) % eng.roadSegments.length]
      ];

      checkSegments.forEach((seg) => {
        if (!seg) return;
        seg.sprites.forEach((sprite) => {
          if (sprite.collected) return;

          // Check spatial overlapping
          const zDiff = Math.abs(sprite.z - eng.playerZ);
          
          // Magnet power-up pulls coins automatically
          const isCoin = sprite.type === 'coin';
          if (isCoin && activeMagnet > 0 && zDiff < 1400) {
            // Drag coin towards playerX
            const lerpFactor = 5 * dt;
            sprite.offset += (eng.playerX - sprite.offset) * lerpFactor;
          }

          if (zDiff < 110) {
            const laneDiff = Math.abs(sprite.offset - eng.playerX);
            
            if (laneDiff < 0.4) {
              // 1. Trigger Collectibles
              if (isCoin) {
                sprite.collected = true;
                const coinYield = activeCoinBooster > 0 ? 2 : 1;
                sound.playCoin();
                setCoinsInRun((prev) => prev + coinYield);
                eng.totalCoinsCollectedThisRun += coinYield;
              } else if (sprite.type === 'gem') {
                sprite.collected = true;
                sound.playGem();
                onUpdateStats({ ...stats, gems: stats.gems + 1 });
              } else if (sprite.type === 'shield') {
                sprite.collected = true;
                sound.playShield();
                setActiveShield((prev) => prev + 12);
              } else if (sprite.type === 'nitro') {
                sprite.collected = true;
                sound.playBoost();
                setActiveNitro((prev) => prev + 6);
                eng.speed = eng.maxSpeed * 1.5;
              } else if (sprite.type === 'magnet') {
                sprite.collected = true;
                sound.playShield();
                setActiveMagnet((prev) => prev + 15);
              } else if (sprite.type === 'booster') {
                sprite.collected = true;
                sound.playShield();
                setActiveCoinBooster((prev) => prev + 15);
              } else if (sprite.type === 'repair') {
                sprite.collected = true;
                sound.playShield();
                setHealth((prev) => Math.min(100, prev + 25));
              } 
              
              // 2. Trigger Obstacle Crashes
              else if (['car', 'truck', 'bus', 'cone', 'barrier', 'log', 'rock_boulder'].includes(sprite.type)) {
                sprite.collected = true; // prevent multi collision hits

                if (activeShield > 0) {
                  // Shield absorbs crash impact!
                  setActiveShield(0);
                  sound.playShield(); // break shield sound
                  // Make invulnerable brief flash
                  setFlashRed(true);
                  setTimeout(() => setFlashRed(false), 200);
                } else if (activeNitro > 0) {
                  // Nitro obliterates and crashes obstacle without taking damage!
                  sound.playCrash();
                  eng.obstaclesAvoidedThisRun += 1;
                  // spawn rich particle sparks
                  for (let s = 0; s < 15; s++) {
                    eng.particles.push({
                      x: width / 2,
                      y: height - 120,
                      vx: (Math.random() - 0.5) * 400,
                      vy: -50 - Math.random() * 200,
                      color: '#f59e0b',
                      life: 0.5,
                      size: 3 + Math.random() * 4,
                      alpha: 1
                    });
                  }
                } else {
                  // Hard Crash damage
                  sound.playCrash();
                  setFlashRed(true);
                  if (settings.vibrationOn && navigator.vibrate) {
                    navigator.vibrate(300);
                  }
                  setTimeout(() => setFlashRed(false), 250);

                  // Reduce health
                  let dmg = 25;
                  if (stats.activeCar === 'suv') dmg = 15; // heavy SUV resists damage
                  
                  const targetHealth = Math.max(0, health - dmg);
                  setHealth(targetHealth);
                  
                  // Decelerate significantly
                  eng.speed = Math.max(100, eng.speed * 0.15);

                  // Trigger Game Over if 0 health
                  if (targetHealth <= 0) {
                    handleRunGameOver();
                  }
                }
              }
            } else if (zDiff < 50) {
              // Dodged obstacle safely!
              if (['car', 'truck', 'bus', 'cone', 'barrier', 'log', 'rock_boulder'].includes(sprite.type)) {
                eng.obstaclesAvoidedThisRun += 1;
                if (stats.activeCar === 'police') {
                  sound.playSiren(); // brief siren whoop for neat enforcer
                }
              }
            }
          }
        });
      });
    }
  };

  // ----------------------------------------------------
  // Render / Drawing Mechanics (2.5D Canvas Camera)
  // ----------------------------------------------------
  const renderGame = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const eng = engineRef.current;
    const segments = eng.roadSegments;
    const playerZ = eng.playerZ;
    const playerX = eng.playerX;
    const cameraDepth = 0.8; // projection depth
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Find starting segment index
    const startSegIndex = Math.floor(playerZ / ROAD_SEGMENT_LENGTH);
    const baseSegment = segments[startSegIndex % segments.length];
    
    // 1. Draw Parallax Background Sky based on environment theme
    const theme = ENV_THEMES[currentEnv];
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height / 2);
    skyGrad.addColorStop(0, theme.skyGrad[0]);
    skyGrad.addColorStop(0.6, theme.skyGrad[1]);
    skyGrad.addColorStop(1, theme.skyGrad[2]);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height / 2);

    // Draw dynamic sky elements (Clouds, Sun/Moon)
    if (currentEnv === 'desert') {
      // Hot orange sun
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 40;
      ctx.beginPath();
      ctx.arc(width - 120, 80, 45, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0; // reset
    } else if (currentEnv === 'night') {
      // Midnight moon
      ctx.fillStyle = '#cbd5e1';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(width - 150, 70, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (currentEnv === 'mountain') {
      // Snowy mountain backdrops
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(100, height / 2);
      ctx.lineTo(250, height / 2 - 80);
      ctx.lineTo(400, height / 2);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff'; // snow cap
      ctx.beginPath();
      ctx.moveTo(212, height / 2 - 60);
      ctx.lineTo(250, height / 2 - 80);
      ctx.lineTo(288, height / 2 - 60);
      ctx.fill();
    }

    // Clouds scrolling
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(width / 3, 50, 100, 20);
    ctx.fillRect(width * 0.7, 70, 140, 25);

    // 2. Project & Render Road Segments
    let maxy = height;
    let x = 0;
    let dx = 0;

    // Projection loop from back to front (horizon to camera)
    for (let i = 0; i < VISIBLE_SEGMENTS; i++) {
      const segIndex = (startSegIndex + i) % segments.length;
      const segment = segments[segIndex];
      
      const cameraZ = playerZ - (i < 3 ? 0 : 0);
      const segmentZ = segment.p1.z - (segment.p1.z < playerZ ? eng.roadTotalZ : 0);

      const cameraHeight = 1200; // view elevation

      // 3D calculation
      const relativeZ = segmentZ - playerZ;
      if (relativeZ <= 0) continue;

      const scale = cameraDepth / (relativeZ / ROAD_SEGMENT_LENGTH);
      
      // Update projected geometry variables
      segment.p1.screenX = Math.floor((width / 2) + (x - playerX * ROAD_WIDTH) * scale * (width / 2) / ROAD_WIDTH);
      segment.p1.screenY = Math.floor((height / 2) + (cameraHeight - segment.hill) * scale * (height / 2) / ROAD_WIDTH);
      segment.p1.screenW = Math.floor(ROAD_WIDTH * scale * (width / 2) / ROAD_WIDTH);

      // Accumulate curves
      x += dx;
      dx += segment.curve;

      // Skip drawing if segment is completely below the bottom edge
      if (segment.p1.screenY >= maxy) continue;
      maxy = segment.p1.screenY;

      // Draw segment slices
      const p1 = segment.p1;
      const p2Index = (segIndex + 1) % segments.length;
      const p2Seg = segments[p2Index];
      if (!p2Seg) continue;
      
      const p2RelativeZ = p2Seg.p1.z - (p2Seg.p1.z < playerZ ? eng.roadTotalZ : 0) - playerZ;
      if (p2RelativeZ <= 0) continue;
      const p2Scale = cameraDepth / (p2RelativeZ / ROAD_SEGMENT_LENGTH);

      const p2ScreenX = Math.floor((width / 2) + (x + dx - playerX * ROAD_WIDTH) * p2Scale * (width / 2) / ROAD_WIDTH);
      const p2ScreenY = Math.floor((height / 2) + (cameraHeight - p2Seg.hill) * p2Scale * (height / 2) / ROAD_WIDTH);
      const p2ScreenW = Math.floor(ROAD_WIDTH * p2Scale * (width / 2) / ROAD_WIDTH);

      // Drawing polygons
      // Ground / grass flanking road
      ctx.fillStyle = segment.color.grass;
      ctx.fillRect(0, p2ScreenY, width, p1.screenY - p2ScreenY);

      // Rumble shoulders
      const r1 = p1.screenW * 0.12;
      const r2 = p2ScreenW * 0.12;
      ctx.fillStyle = segment.color.rumble;
      drawPolygon(ctx, p1.screenX - p1.screenW - r1, p1.screenY, p1.screenX - p1.screenW, p1.screenY, p2ScreenX - p2ScreenW, p2ScreenY, p2ScreenX - p2ScreenW - r2, p2ScreenY);
      drawPolygon(ctx, p1.screenX + p1.screenW, p1.screenY, p1.screenX + p1.screenW + r1, p1.screenY, p2ScreenX + p2ScreenW + r2, p2ScreenY, p2ScreenX + p2ScreenW, p2ScreenY);

      // Road Surface
      ctx.fillStyle = segment.color.road;
      drawPolygon(ctx, p1.screenX - p1.screenW, p1.screenY, p1.screenX + p1.screenW, p1.screenY, p2ScreenX + p2ScreenW, p2ScreenY, p2ScreenX - p2ScreenW, p2ScreenY);

      // Lanes separators
      if (segment.color.lanes !== 'transparent') {
        const laneW1 = p1.screenW * 0.02;
        const laneW2 = p2ScreenW * 0.02;
        ctx.fillStyle = '#ffffff';

        // Dashed lines between lanes
        const l1 = p1.screenX - p1.screenW / 3;
        const l2 = p2ScreenX - p2ScreenW / 3;
        drawPolygon(ctx, l1 - laneW1, p1.screenY, l1 + laneW1, p1.screenY, l2 + laneW2, p2ScreenY, l2 - laneW2, p2ScreenY);

        const r_l1 = p1.screenX + p1.screenW / 3;
        const r_l2 = p2ScreenX + p2ScreenW / 3;
        drawPolygon(ctx, r_l1 - laneW1, p1.screenY, r_l1 + laneW1, p1.screenY, r_l2 + laneW2, p2ScreenY, r_l2 - laneW2, p2ScreenY);
      }
    }

    // 3. Draw Projected Sprites back-to-front (Scenery & Coins)
    for (let i = VISIBLE_SEGMENTS - 1; i >= 0; i--) {
      const segIndex = (startSegIndex + i) % segments.length;
      const segment = segments[segIndex];
      const cameraZ = playerZ;
      const segmentZ = segment.p1.z - (segment.p1.z < playerZ ? eng.roadTotalZ : 0);
      const relativeZ = segmentZ - playerZ;
      if (relativeZ <= 0) continue;

      const scale = cameraDepth / (relativeZ / ROAD_SEGMENT_LENGTH);

      segment.sprites.forEach((sprite) => {
        if (sprite.collected) return;

        const spriteScale = scale * (sprite.scale || 1.0);
        
        // Calculate offset horizontal coordinates based on curve aggregation
        const spriteX = segment.p1.screenX + (sprite.offset * segment.p1.screenW);
        const spriteY = segment.p1.screenY;

        drawSprite(ctx, spriteX, spriteY, spriteScale, sprite.type, sprite.color || '#ff0000');
      });
    }

    // 4. Draw Player's Active Driving Car
    drawPlayerCar(ctx, width, height);

    // 5. Render overlays (Headlights at night, particles, weather rain)
    if (currentEnv === 'night' || currentEnv === 'city') {
      // Draw Headlight glowing overlay gradients
      const headGrad = ctx.createRadialGradient(width / 2, height - 120, 20, width / 2, height - 250, 200);
      headGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
      headGrad.addColorStop(1, 'rgba(254, 240, 138, 0.0)');
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 45, height - 120);
      ctx.lineTo(width / 2 - 180, height - 320);
      ctx.lineTo(width / 2 + 180, height - 320);
      ctx.lineTo(width / 2 + 45, height - 120);
      ctx.closePath();
      ctx.fill();
    }

    // Render active particles sparks
    eng.particles.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0; // reset
    });

    // Render falling weather particles overlay (rain/snow)
    const isRain = currentEnv === 'rainy';
    const isSnow = currentEnv === 'mountain';
    if (isRain) {
      ctx.strokeStyle = 'rgba(156, 163, 175, 0.4)';
      ctx.lineWidth = 1.5;
      eng.weatherParticles.forEach((wp) => {
        ctx.beginPath();
        ctx.moveTo(wp.x, wp.y);
        ctx.lineTo(wp.x + Math.cos(wp.angle) * wp.length, wp.y + Math.sin(wp.angle) * wp.length);
        ctx.stroke();
      });
    } else if (isSnow) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      eng.weatherParticles.forEach((wp) => {
        ctx.beginPath();
        ctx.arc(wp.x, wp.y, wp.length * 0.25, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  };

  // Helper polygon drawing
  const drawPolygon = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.closePath();
    ctx.fill();
  };

  // ----------------------------------------------------
  // Render Dynamic Car Sprites & Obstacles on Canvas
  // ----------------------------------------------------
  const drawSprite = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, type: string, color: string) => {
    const baseW = 100;
    const baseH = 80;
    const w = baseW * scale;
    const h = baseH * scale;

    ctx.save();
    ctx.translate(x, y);

    switch (type) {
      case 'coin':
        // Golden rotating coin
        ctx.fillStyle = '#facc15';
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.ellipse(0, -10 * scale, 18 * scale, 18 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Inner detail
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.ellipse(0, -10 * scale, 10 * scale, 10 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'gem':
        // Cyan diamond gem
        ctx.fillStyle = '#06b6d4';
        ctx.strokeStyle = '#0891b2';
        ctx.lineWidth = 1.5 * scale;
        ctx.beginPath();
        ctx.moveTo(0, -25 * scale);
        ctx.lineTo(15 * scale, -12 * scale);
        ctx.lineTo(0, 0);
        ctx.lineTo(-15 * scale, -12 * scale);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case 'shield':
        ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 3 * scale;
        ctx.beginPath();
        ctx.arc(0, -15 * scale, 25 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;

      case 'nitro':
        // Yellow bolt
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(0, -32 * scale);
        ctx.lineTo(15 * scale, -15 * scale);
        ctx.lineTo(3 * scale, -15 * scale);
        ctx.lineTo(8 * scale, 0);
        ctx.lineTo(-15 * scale, -18 * scale);
        ctx.lineTo(-3 * scale, -18 * scale);
        ctx.closePath();
        ctx.fill();
        break;

      case 'magnet':
        // Magnet loop
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 6 * scale;
        ctx.beginPath();
        ctx.arc(0, -15 * scale, 15 * scale, Math.PI, 0, false);
        ctx.stroke();
        break;

      case 'booster':
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.arc(0, -15 * scale, 18 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${12 * scale}px sans-serif`;
        ctx.fillText('2X', -8 * scale, -11 * scale);
        break;

      case 'repair':
        // Green medic cross
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(-15 * scale, -20 * scale, 30 * scale, 10 * scale);
        ctx.fillRect(-5 * scale, -30 * scale, 10 * scale, 30 * scale);
        break;

      case 'cone':
        // Orange traffic cones
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(-15 * scale, 0);
        ctx.lineTo(15 * scale, 0);
        ctx.lineTo(5 * scale, -35 * scale);
        ctx.lineTo(-5 * scale, -35 * scale);
        ctx.closePath();
        ctx.fill();
        // White stripe
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-6 * scale, -20 * scale, 12 * scale, 6 * scale);
        break;

      case 'barrier':
        // Construction wooden barrier stripes
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-25 * scale, -30 * scale, 50 * scale, 12 * scale);
        ctx.fillStyle = '#000000';
        ctx.fillRect(-15 * scale, -30 * scale, 6 * scale, 12 * scale);
        ctx.fillRect(10 * scale, -30 * scale, 6 * scale, 12 * scale);
        // Feet
        ctx.fillStyle = '#475569';
        ctx.fillRect(-20 * scale, -18 * scale, 6 * scale, 18 * scale);
        ctx.fillRect(14 * scale, -18 * scale, 6 * scale, 18 * scale);
        break;

      case 'log':
        // Fallen brown log obstacle
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-40 * scale, -12 * scale, 80 * scale, 12 * scale);
        ctx.fillStyle = '#b45309';
        ctx.fillRect(-36 * scale, -10 * scale, 72 * scale, 4 * scale);
        break;

      case 'jungle_tree':
      case 'palm_tree':
        // Beautiful green tree
        ctx.fillStyle = '#78350f'; // trunk
        ctx.fillRect(-8 * scale, -30 * scale, 16 * scale, 30 * scale);
        ctx.fillStyle = '#15803d'; // foliage
        ctx.beginPath();
        ctx.arc(0, -45 * scale, 32 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-15 * scale, -35 * scale, 24 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(15 * scale, -35 * scale, 24 * scale, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'snowy_pine':
        ctx.fillStyle = '#451a03'; // trunk
        ctx.fillRect(-6 * scale, -25 * scale, 12 * scale, 25 * scale);
        ctx.fillStyle = '#166534'; // pine layers
        ctx.beginPath();
        ctx.moveTo(-30 * scale, -15 * scale);
        ctx.lineTo(30 * scale, -15 * scale);
        ctx.lineTo(0, -50 * scale);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff'; // snow caps
        ctx.beginPath();
        ctx.moveTo(-15 * scale, -25 * scale);
        ctx.lineTo(15 * scale, -25 * scale);
        ctx.lineTo(0, -50 * scale);
        ctx.closePath();
        ctx.fill();
        break;

      case 'cactus_tall':
        ctx.fillStyle = '#166534';
        ctx.fillRect(-6 * scale, -50 * scale, 12 * scale, 50 * scale); // central
        ctx.fillRect(-20 * scale, -35 * scale, 15 * scale, 6 * scale); // arm left
        ctx.fillRect(-20 * scale, -35 * scale, 6 * scale, 15 * scale);
        ctx.fillRect(5 * scale, -25 * scale, 15 * scale, 6 * scale); // arm right
        ctx.fillRect(14 * scale, -25 * scale, 6 * scale, 15 * scale);
        break;

      case 'street_lamp':
        ctx.fillStyle = '#475569';
        ctx.fillRect(-3 * scale, -80 * scale, 6 * scale, 80 * scale); // post
        ctx.fillRect(-15 * scale, -80 * scale, 15 * scale, 6 * scale); // arm
        // Glow bulb
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(-15 * scale, -74 * scale, 6 * scale, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'car':
      case 'truck':
      case 'bus':
        // Obstacle vehicles in perspective traffic
        const bodyH = type === 'truck' ? 55 : type === 'bus' ? 45 : 30;
        const bodyW = type === 'truck' ? 50 : type === 'bus' ? 55 : 44;
        
        // Shadow under traffic
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(0, 0, bodyW * scale, 10 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Chassis/Wheels
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-bodyW * 0.9 * scale, -10 * scale, 8 * scale, 10 * scale);
        ctx.fillRect(bodyW * 0.7 * scale, -10 * scale, 8 * scale, 10 * scale);

        // Main colored block
        ctx.fillStyle = color;
        ctx.fillRect(-bodyW * scale, -bodyH * scale, bodyW * 2 * scale, bodyH * scale);

        // Windshield glass
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-bodyW * 0.8 * scale, -bodyH * 0.9 * scale, bodyW * 1.6 * scale, bodyH * 0.3 * scale);

        // Brakelights red glow
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-bodyW * 0.9 * scale, -bodyH * 0.4 * scale, 10 * scale, 6 * scale);
        ctx.fillRect(bodyW * 0.7 * scale, -bodyH * 0.4 * scale, 10 * scale, 6 * scale);
        break;

      default:
        // Default box boulder fallback
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(0, -15 * scale, 22 * scale, 0, Math.PI * 2);
        ctx.fill();
        break;
    }

    ctx.restore();
  };

  // ----------------------------------------------------
  // Render User Sports Car at Bottom (Centered / Offset)
  // ----------------------------------------------------
  const drawPlayerCar = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const isBraking = engineRef.current.keys.down;
    const isSteeringLeft = engineRef.current.keys.left;
    const isSteeringRight = engineRef.current.keys.right;

    // Center coordinates for drawing at bottom
    // Slight horizontal sway depending on playerX
    const carX = width / 2;
    const carY = height - 50;
    const scale = 1.0;

    ctx.save();
    ctx.translate(carX, carY);

    // Car shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 75, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wheels (with slight rotation shift during steering)
    ctx.fillStyle = '#18181b';
    const leftSteerAngle = isSteeringLeft ? -0.15 : isSteeringRight ? 0.15 : 0;
    
    // Left wheel
    ctx.save();
    ctx.translate(-58, -10);
    ctx.rotate(leftSteerAngle);
    ctx.fillRect(-10, -18, 18, 32);
    ctx.restore();

    // Right wheel
    ctx.save();
    ctx.translate(58, -10);
    ctx.rotate(leftSteerAngle);
    ctx.fillRect(-10, -18, 18, 32);
    ctx.restore();

    // Main Body Color
    ctx.fillStyle = activeCarConfig.color;
    ctx.beginPath();
    ctx.moveTo(-50, -12);
    ctx.quadraticCurveTo(-55, -28, -45, -34);
    ctx.lineTo(45, -34);
    ctx.quadraticCurveTo(55, -28, 50, -12);
    ctx.closePath();
    ctx.fill();

    // Aerodynamic bumper flares
    ctx.fillRect(-56, -18, 112, 12);

    // Windshield Cabin
    ctx.fillStyle = '#0f172a'; // dark tint glass
    ctx.beginPath();
    ctx.moveTo(-35, -34);
    ctx.lineTo(-24, -58);
    ctx.lineTo(24, -58);
    ctx.lineTo(35, -34);
    ctx.closePath();
    ctx.fill();

    // Rear engine window details
    ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.fillRect(-15, -48, 30, 10);

    // Tail Brake lights
    if (isBraking) {
      ctx.fillStyle = '#ef4444'; // glowing hot red
      ctx.shadowColor = '#f87171';
      ctx.shadowBlur = 18;
    } else {
      ctx.fillStyle = '#991b1b'; // idle red
    }
    ctx.fillRect(-50, -26, 14, 6);
    ctx.fillRect(36, -26, 14, 6);
    ctx.shadowBlur = 0; // reset

    // Exhaust tailpipes
    ctx.fillStyle = '#71717a';
    ctx.fillRect(-25, -5, 8, 5);
    ctx.fillRect(17, -5, 8, 5);

    // Flashing bubble shield indicator
    if (activeShield > 0) {
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(0, -25, 85, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  };

  // ----------------------------------------------------
  // Scoreboard Save / GameOver Logic
  // ----------------------------------------------------
  const handleRunGameOver = () => {
    setIsPlaying(false);
    sound.stopMusic();
    sound.stopEngine();
    
    // Check if user has highscore or distance record
    const finalScore = score;
    const finalDist = distance;
    
    let isNewHigh = finalScore > stats.highScore;
    let isNewDist = finalDist > stats.bestDistance;

    const updatedStats: PlayerStats = {
      ...stats,
      coins: stats.coins + coinsInRun,
      highScore: isNewHigh ? finalScore : stats.highScore,
      bestDistance: isNewDist ? finalDist : stats.bestDistance,
      totalDistanceDriven: stats.totalDistanceDriven + finalDist,
      totalCoinsCollected: stats.totalCoinsCollected + coinsInRun,
      obstaclesAvoided: stats.obstaclesAvoided + engineRef.current.obstaclesAvoidedThisRun,
    };

    onUpdateStats(updatedStats);
    onGameOver(finalScore, finalDist);
  };

  // ----------------------------------------------------
  // Interactive Adsterra Rewarded Ad Simulation
  // ----------------------------------------------------
  const watchRewardedAd = () => {
    sound.playCoin();
    setShowRewardedAd(true);
    setRewardedAdTimer(5);
    
    // Decrement timer
    const interval = setInterval(() => {
      setRewardedAdTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowRewardedAd(false);
          // Revive with full health!
          setHealth(100);
          setActiveShield(10); // give invulnerability shield
          setIsPlaying(true);
          sound.startMusic();
          sound.startEngine();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div 
      id="gameplay_canvas_panel" 
      className={`relative bg-slate-950 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl flex flex-col transition-all duration-300 ${
        isPortrait ? 'w-full max-w-[420px] h-[640px] mx-auto shadow-cyan-950/20' : 'w-full h-[580px]'
      }`}
    >
      
      {/* 1. HUD Metrics Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center bg-slate-900/80 backdrop-blur-md border border-slate-800 px-4 py-2.5 rounded-xl">
        
        {/* Left Side: Score & Dist */}
        <div className="flex gap-4 items-center">
          <div>
            <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Score</span>
            <span className="text-yellow-400 font-mono font-bold text-lg">{score.toLocaleString()}</span>
          </div>
          <div className="h-6 w-px bg-slate-800"></div>
          <div>
            <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Distance</span>
            <span className="text-white font-mono font-semibold text-base">{distance.toLocaleString()}m</span>
          </div>
        </div>

        {/* Center: Environment Name & Weather Indicator */}
        <div className="text-center">
          <span className="text-[8px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded font-extrabold uppercase tracking-widest animate-pulse">
            {currentEnv === 'jungle' && '🌲 Jungle Road'}
            {currentEnv === 'mountain' && '🏔 Mountain Road'}
            {currentEnv === 'city' && '🏙 City Highway'}
            {currentEnv === 'desert' && '🌵 Desert Road'}
            {currentEnv === 'rainy' && '🌧 Rainy Forest'}
            {currentEnv === 'night' && '🌃 Night Highway'}
          </span>
          <div className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wide">
            {currentEnv === 'rainy' ? '⚠️ Heavy Rains & Fog' : currentEnv === 'mountain' ? '❄️ Blizzard Snow' : '🛣 Dynamic Asphalt'}
          </div>
        </div>

        {/* Right Side: Health & Coins */}
        <div className="flex gap-4 items-center">
          <div>
            <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider text-right">Coins</span>
            <span className="text-yellow-400 font-mono font-bold text-base flex items-center gap-1">
              🪙 {coinsInRun}
            </span>
          </div>
          <div className="h-6 w-px bg-slate-800"></div>
          
          {/* Health Bar */}
          <div className="w-24">
            <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase mb-0.5">
              <span>Car Health</span>
              <span className={health < 40 ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}>{health}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700/50">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${health < 40 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                style={{ width: `${health}%` }}
              ></div>
            </div>
          </div>
        </div>

      </div>

      {/* 2. Top-Bottom Adsterra Placeholder Banner */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-[320px] bg-slate-900/90 backdrop-blur border border-slate-800 p-2 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[8px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1 py-0.5 rounded font-extrabold font-mono tracking-wide">ADSTERRA</span>
          <span className="text-[10px] text-slate-300 font-medium">Click to claim free coin drop!</span>
        </div>
        <button 
          onClick={() => {
            sound.playCoin();
            setCoinsInRun((prev) => prev + 50);
            alert('Adsterra Integration: Mock Ad banner clicked! Awarded 🪙 50 coins.');
          }}
          className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[10px] font-bold rounded cursor-pointer"
        >
          CLAIM
        </button>
      </div>

      {/* 3. On-Screen Active Boosters HUD */}
      <div className="absolute left-4 top-20 z-10 flex flex-col gap-2">
        {activeShield > 0 && (
          <div className="bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold animate-pulse">
            <Shield className="w-4 h-4" /> Shield Active ({activeShield}s)
          </div>
        )}
        {activeNitro > 0 && (
          <div className="bg-yellow-950/80 border border-yellow-500/30 text-yellow-400 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold animate-pulse">
            <Zap className="w-4 h-4" /> NITRO THRUSTERS ({activeNitro}s)
          </div>
        )}
        {activeMagnet > 0 && (
          <div className="bg-rose-950/80 border border-rose-500/30 text-rose-400 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold">
            <Magnet className="w-4 h-4" /> Coin Magnet ({activeMagnet}s)
          </div>
        )}
        {activeCoinBooster > 0 && (
          <div className="bg-purple-950/80 border border-purple-500/30 text-purple-400 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold">
            <Sparkles className="w-4 h-4" /> 2X COIN HYPER ({activeCoinBooster}s)
          </div>
        )}
      </div>

      {/* 4. Active Interactive Inventory Tray (Tappable during game!) */}
      <div className="absolute right-4 top-20 z-10 flex flex-col gap-2">
        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider text-right mb-1">Booster Tray</span>
        
        {/* Shield Trigger */}
        <button
          onClick={() => usePowerUp('shield')}
          disabled={inventory.shield <= 0}
          className={`p-2 bg-slate-900 border text-xs font-bold rounded-lg flex flex-col items-center gap-1 cursor-pointer transition-all ${
            inventory.shield > 0 ? 'border-cyan-500 text-cyan-400 hover:bg-slate-800' : 'border-slate-800 text-slate-600 cursor-not-allowed opacity-40'
          }`}
        >
          <Shield className="w-5 h-5" />
          <span>SHLD ({inventory.shield})</span>
        </button>

        {/* Nitro Trigger */}
        <button
          onClick={() => usePowerUp('nitro')}
          disabled={inventory.nitro <= 0}
          className={`p-2 bg-slate-900 border text-xs font-bold rounded-lg flex flex-col items-center gap-1 cursor-pointer transition-all ${
            inventory.nitro > 0 ? 'border-yellow-500 text-yellow-400 hover:bg-slate-800' : 'border-slate-800 text-slate-600 cursor-not-allowed opacity-40'
          }`}
        >
          <Zap className="w-5 h-5" />
          <span>NTRO ({inventory.nitro})</span>
        </button>

        {/* Magnet Trigger */}
        <button
          onClick={() => usePowerUp('magnet')}
          disabled={inventory.magnet <= 0}
          className={`p-2 bg-slate-900 border text-xs font-bold rounded-lg flex flex-col items-center gap-1 cursor-pointer transition-all ${
            inventory.magnet > 0 ? 'border-rose-500 text-rose-400 hover:bg-slate-800' : 'border-slate-800 text-slate-600 cursor-not-allowed opacity-40'
          }`}
        >
          <Magnet className="w-5 h-5" />
          <span>MAG ({inventory.magnet})</span>
        </button>

        {/* 2X Booster Trigger */}
        <button
          onClick={() => usePowerUp('coinBooster')}
          disabled={inventory.coinBooster <= 0}
          className={`p-2 bg-slate-900 border text-xs font-bold rounded-lg flex flex-col items-center gap-1 cursor-pointer transition-all ${
            inventory.coinBooster > 0 ? 'border-purple-500 text-purple-400 hover:bg-slate-800' : 'border-slate-800 text-slate-600 cursor-not-allowed opacity-40'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span>2X ({inventory.coinBooster})</span>
        </button>
      </div>

      {/* 5. Mobile / Interactive Controls (Left Thumb: Steer, Right Thumb: Speed) */}
      <div className="absolute inset-x-4 bottom-4 z-10 flex justify-between pointer-events-none">
        {/* Left Side: Steering Controls */}
        <div className="flex gap-2.5 pointer-events-auto">
          {/* Steering Left */}
          <button
            onMouseDown={startSteerLeft}
            onMouseUp={stopSteerLeft}
            onMouseLeave={stopSteerLeft}
            onTouchStart={startSteerLeft}
            onTouchEnd={stopSteerLeft}
            className="w-16 h-16 bg-slate-900/75 active:bg-cyan-500/40 border border-slate-700/80 rounded-full flex flex-col items-center justify-center text-white cursor-pointer select-none shadow-lg transition-all active:scale-90"
            title="Steer Left"
          >
            <span className="text-xl font-bold font-mono">◀</span>
            <span className="text-[9px] text-cyan-400 font-extrabold uppercase tracking-wider font-mono">LEFT</span>
          </button>

          {/* Steering Right */}
          <button
            onMouseDown={startSteerRight}
            onMouseUp={stopSteerRight}
            onMouseLeave={stopSteerRight}
            onTouchStart={startSteerRight}
            onTouchEnd={stopSteerRight}
            className="w-16 h-16 bg-slate-900/75 active:bg-cyan-500/40 border border-slate-700/80 rounded-full flex flex-col items-center justify-center text-white cursor-pointer select-none shadow-lg transition-all active:scale-90"
            title="Steer Right"
          >
            <span className="text-xl font-bold font-mono">▶</span>
            <span className="text-[9px] text-cyan-400 font-extrabold uppercase tracking-wider font-mono">RIGHT</span>
          </button>
        </div>

        {/* Right Side: Speed Controls */}
        <div className="flex gap-2.5 pointer-events-auto">
          {/* Slow Button */}
          <button
            onMouseDown={() => { engineRef.current.keys.down = true; }}
            onMouseUp={() => { engineRef.current.keys.down = false; }}
            onMouseLeave={() => { engineRef.current.keys.down = false; }}
            onTouchStart={() => { engineRef.current.keys.down = true; }}
            onTouchEnd={() => { engineRef.current.keys.down = false; }}
            className="w-16 h-16 bg-slate-900/75 active:bg-rose-500/40 border border-slate-700/80 rounded-full flex flex-col items-center justify-center text-white cursor-pointer select-none shadow-lg transition-all active:scale-90"
            title="Slow Down"
          >
            <span className="text-xl">🐌</span>
            <span className="text-[9px] text-rose-400 font-extrabold uppercase tracking-wider font-mono">SLOW</span>
          </button>

          {/* Speed Button */}
          <button
            onMouseDown={() => { engineRef.current.keys.up = true; }}
            onMouseUp={() => { engineRef.current.keys.up = false; }}
            onMouseLeave={() => { engineRef.current.keys.up = false; }}
            onTouchStart={() => { engineRef.current.keys.up = true; }}
            onTouchEnd={() => { engineRef.current.keys.up = false; }}
            className="w-16 h-16 bg-slate-900/75 active:bg-amber-500/40 border border-slate-700/80 rounded-full flex flex-col items-center justify-center text-white cursor-pointer select-none shadow-lg transition-all active:scale-90"
            title="Accelerate / Speed"
          >
            <span className="text-xl">⚡</span>
            <span className="text-[9px] text-amber-400 font-extrabold uppercase tracking-wider font-mono">SPEED</span>
          </button>
        </div>
      </div>

      {/* Core Canvas Element */}
      <canvas
        ref={canvasRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex-1 w-full h-full block cursor-crosshair bg-slate-950"
      />

      {/* 6. Crimson Crash Damage Overlay Flash */}
      <AnimatePresence>
        {flashRed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-red-600/50 pointer-events-none z-20 flex items-center justify-center"
          >
            <AlertTriangle className="w-20 h-20 text-white animate-ping" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. Initial Countdown 3-2-1 Overlay */}
      <AnimatePresence>
        {!isPlaying && (
          <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center z-30">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring' }}
              className="text-center"
            >
              <span className="text-xs text-cyan-400 font-bold uppercase tracking-widest block mb-4">Warming up motor...</span>
              <h1 className="text-7xl font-extrabold font-mono text-yellow-400 drop-shadow-lg tracking-wider animate-pulse">
                {countdown}
              </h1>
              <span className="text-[10px] text-slate-500 mt-6 block">Use Keyboard Arrows or Left/Right On-Screen Controls</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. Fullscreen Pause Modal */}
      <AnimatePresence>
        {isPaused && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center z-30 p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-1">RACE PAUSED</h2>
              <p className="text-xs text-slate-400 mb-6">Your engine is currently idling</p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handlePauseToggle}
                  className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
                >
                  RESUME SPEEDWAY
                </button>
                <button
                  onClick={handleRestart}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl active:scale-95 transition-all cursor-pointer"
                >
                  RESTART RUN
                </button>
                <button
                  onClick={onBackToMenu}
                  className="w-full py-2.5 bg-rose-950/30 text-rose-400 border border-rose-900/40 rounded-xl hover:bg-rose-900/20 active:scale-95 transition-all cursor-pointer text-xs"
                >
                  ABANDON RACE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9. Adsterra Rewarded Interactive Popup (Video simulation) */}
      <AnimatePresence>
        {showRewardedAd && (
          <div className="absolute inset-0 bg-slate-950 z-50 flex flex-col items-center justify-center p-6 text-center">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="max-w-md bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col items-center gap-4"
            >
              <div className="p-4 bg-amber-500/15 rounded-2xl border border-amber-500/20 text-amber-400">
                <Video className="w-12 h-12 animate-pulse" />
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-3 py-1 rounded border border-slate-700 font-extrabold uppercase tracking-widest">ADSTERRA REWARDED AD</span>
              <h3 className="text-lg font-bold">Watch Video to Revive Vehicle</h3>
              <p className="text-xs text-slate-400">Restores 100% Car Health and grants a 10s energy shield upon return!</p>
              
              {/* Fake Countdown video wheel */}
              <div className="w-16 h-16 rounded-full border-4 border-amber-500 border-t-transparent animate-spin flex items-center justify-center my-2">
                <span className="text-lg font-bold font-mono text-amber-400">{rewardedAdTimer}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 10. Pause trigger and Screen Rotate overlays */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <button
          onClick={() => {
            sound.playCoin();
            setIsPortrait(!isPortrait);
          }}
          className="px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-cyan-400 hover:text-cyan-300 rounded-lg cursor-pointer text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-md"
          title="Rotate Screen (Landscape / Portrait)"
        >
          <RefreshCw className="w-3.5 h-3.5" /> {isPortrait ? '🔄 Landscape Mode' : '🔄 Portrait Mode'}
        </button>
        {isPlaying && !isPaused && (
          <button
            onClick={handlePauseToggle}
            className="px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white rounded-lg cursor-pointer text-xs font-bold transition-all active:scale-95 shadow-md"
          >
            ⏸ Pause
          </button>
        )}
      </div>

    </div>
  );
}
