import { useEffect, useRef } from 'react';

export default function SocialBarAd() {
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    // 1. Inject the Adsterra Social Bar script dynamically
    const script = document.createElement('script');
    script.src = 'https://pl30428819.effectivecpmnetwork.com/7b/2a/cd/7b2acd5ba3c85de99cc26d3288cd3149.js';
    script.async = true;
    script.id = 'adsterra-social-bar';
    document.head.appendChild(script);
    scriptRef.current = script;

    // 2. Hide any leftover elements from previous mounts to ensure clean start
    hideSocialBarElements(false);

    return () => {
      // 3. Clean up script tag
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
      }
      
      // 4. Forcefully clean up all injected overlay elements or iframes
      hideSocialBarElements(true);
    };
  }, []);

  const hideSocialBarElements = (hide: boolean) => {
    const root = document.getElementById('root');
    const bodyChildren = Array.from(document.body.children);
    
    bodyChildren.forEach((child) => {
      if (child !== root && child.tagName !== 'SCRIPT') {
        const html = child.innerHTML || '';
        const id = child.id || '';
        const className = child.className || '';
        
        // Match specific Adsterra or iframe patterns precisely, avoiding generic words containing "ad" like "shadow" or "leading"
        const isAdContainer = 
          id.startsWith('at-') || 
          id.startsWith('asg-') ||
          className.startsWith('at-') ||
          className.startsWith('asg-') ||
          html.includes('effectivecpmnetwork') || 
          html.includes('adsterra');

        if (isAdContainer) {
          if (hide) {
            (child as HTMLElement).style.display = 'none';
            (child as HTMLElement).style.pointerEvents = 'none';
            // Schedule cleanup to prevent breaking active JS execution
            setTimeout(() => {
              try {
                if (child.parentNode) child.parentNode.removeChild(child);
              } catch (e) {}
            }, 50);
          } else {
            (child as HTMLElement).style.display = '';
          }
        }
      }
    });

    // Also look for specific iframe overlays injected directly
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach((iframe) => {
      try {
        const src = iframe.src || '';
        if (src.includes('effectivecpmnetwork') || src.includes('adsterra')) {
          const parent = iframe.parentElement;
          if (parent && parent !== root) {
            if (hide) {
              parent.style.display = 'none';
              setTimeout(() => {
                try {
                  if (parent.parentNode) parent.parentNode.removeChild(parent);
                } catch (e) {}
              }, 50);
            }
          }
        }
      } catch (e) {}
    });
  };

  return null; // This ad script overlays on screen automatically
}
