"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function AnimatedBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ alpha: false, antialias: false });
    renderer.setSize(width, height);
    
    // Setup canvas styles manually as absolute overlay behind everything
    renderer.domElement.id = "glcanvas";
    mountRef.current.appendChild(renderer.domElement);

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);

    const uniforms = {
        u_time: { value: 0.0 },
        u_resolution: { value: new THREE.Vector2(width, height) }
    };

    const fragmentShader = `
        uniform vec2 u_resolution;
        uniform float u_time;

        // Random function
        float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }

        // Noise function
        float noise(in vec2 st) {
            vec2 i = floor(st);
            vec2 f = fract(st);
            float a = random(i);
            float b = random(i + vec2(1.0, 0.0));
            float c = random(i + vec2(0.0, 1.0));
            float d = random(i + vec2(1.0, 1.0));
            vec2 u = f*f*(3.0-2.0*f);
            return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        // Function to generate a scratch line
        float scratch(vec2 uv, vec2 p1, vec2 p2, float thickness, float intensity) {
            vec2 pa = uv - p1;
            vec2 ba = p2 - p1;
            float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
            float d = length(pa - ba * h);
            // Sharp anti-aliasing for harsh look
            return smoothstep(thickness, thickness * 0.5, d) * intensity;
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution.xy;
            // Adjust aspect ratio so scratches don't stretch
            uv.x *= u_resolution.x / u_resolution.y;

            // Base color (deep black/dark gray)
            vec3 color = vec3(0.02, 0.02, 0.02);

            // Add base grain/noise
            float grain = random(uv + u_time * 0.0001) * 0.08;
            color += vec3(grain);

            // Add macro noise variations (smudges)
            float smudge = noise(uv * 3.0) * 0.05;
            color += vec3(smudge);

            // Generate specific hard scratches mimicking the reference
            // We hardcode a few prominent lines and add procedural ones
            
            // Massive scratch 1
            float s1 = scratch(uv, vec2(0.1, 1.5), vec2(1.5, -0.2), 0.0015, 0.8);
            // Intersecting scratch
            float s2 = scratch(uv, vec2(-0.2, 0.8), vec2(1.8, 0.6), 0.0008, 0.5);
            // Faint parallel-ish scratch
            float s3 = scratch(uv, vec2(0.0, 1.2), vec2(1.6, 0.1), 0.0005, 0.3);
            
            // Add some procedural fine scratches
            float fineScratches = 0.0;
            for(int i = 0; i < 15; i++) {
                float fi = float(i);
                vec2 p1 = vec2(random(vec2(fi, 1.0)) * 3.0 - 1.0, random(vec2(fi, 2.0)) * 2.0);
                vec2 p2 = vec2(random(vec2(fi, 3.0)) * 3.0 - 1.0, random(vec2(fi, 4.0)) * 2.0);
                float thick = random(vec2(fi, 5.0)) * 0.001 + 0.0002;
                float inten = random(vec2(fi, 6.0)) * 0.4 + 0.1;
                fineScratches += scratch(uv, p1, p2, thick, inten);
            }

            // Combine scratches
            float totalScratches = max(max(s1, s2), s3) + fineScratches;
            
            // Add scratches to base color (white scratches on dark)
            color += vec3(totalScratches);

            gl_FragColor = vec4(color, 1.0);
        }
    `;

    const material = new THREE.ShaderMaterial({
        fragmentShader,
        uniforms,
        depthWrite: false,
        depthTest: false
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let animationFrameId: number;

    const handleResize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setSize(w, h);
        uniforms.u_resolution.value.set(w, h);
    };

    window.addEventListener('resize', handleResize);

    const animate = (time: number) => {
        animationFrameId = requestAnimationFrame(animate);
        uniforms.u_time.value = time;
        renderer.render(scene, camera);
    };
    
    animate(0);

    return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationFrameId);
        
        // Cleanup Three.js
        if (mountRef.current && renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement);
        }
        material.dispose();
        geometry.dispose();
        renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} />;
}
