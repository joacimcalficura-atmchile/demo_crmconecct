"use client";

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface HologramOrbProps {
  volumeLevel: number;
  isActive: boolean;
}

// ── Orbe de partículas "flotante" ────────────────────────────────────────────
// Miles de mini-átomos formando una esfera que fluye con ruido orgánico y
// reacciona a la voz real de Vapi (volumeLevel). Sin recuadro, fondo
// transparente: flota sobre el vidrio del widget. Paleta celeste (el mismo
// sky del chat) con chispas blancas. Reemplaza al antiguo icosaedro wireframe
// semitransparente que se veía difuso al ampliarse.
export const HologramOrb: React.FC<HologramOrbProps> = ({ volumeLevel, isActive }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const materialRef = useRef<THREE.ShaderMaterial | null>(null);
    // El loop de render lee estos refs para tener siempre el valor más reciente
    const volumeRef = useRef(0);
    const activeRef = useRef(false);

    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.z = 50;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        renderer.setPixelRatio(pixelRatio);
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setClearColor(0x000000, 0); // transparente → flota
        container.appendChild(renderer.domElement);

        // 1. Nube de partículas sobre una esfera (distribución Fibonacci optimizada)
        const N = 1200;
        const R = 14;
        const GOLDEN = Math.PI * (3 - Math.sqrt(5));
        const positions = new Float32Array(N * 3);
        const seeds = new Float32Array(N);
        const reacts = new Float32Array(N);
        const cyans = new Float32Array(N);
        for (let i = 0; i < N; i++) {
            const y = 1 - (i / (N - 1)) * 2;
            const r = Math.sqrt(1 - y * y);
            const th = i * GOLDEN;
            positions[i * 3] = Math.cos(th) * r * R;
            positions[i * 3 + 1] = y * R;
            positions[i * 3 + 2] = Math.sin(th) * r * R;
            seeds[i] = Math.random() * 6.283;
            reacts[i] = 0.5 + Math.random();
            cyans[i] = Math.random() < 0.10 ? 1 : 0;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
        geo.setAttribute('aReact', new THREE.BufferAttribute(reacts, 1));
        geo.setAttribute('aCyan', new THREE.BufferAttribute(cyans, 1));

        // 2. Shader de partículas (displacement por ruido + voz)
        const mat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uVoice: { value: 0 },
                uSize: { value: 2.2 },
                uPixel: { value: pixelRatio },
            },
            transparent: true,
            depthWrite: false,
            depthTest: false,
            blending: THREE.AdditiveBlending,
            vertexShader: `
                attribute float aSeed;
                attribute float aReact;
                attribute float aCyan;
                uniform float uTime;
                uniform float uVoice;
                uniform float uSize;
                uniform float uPixel;
                varying float vDepth;
                varying float vNoise;
                varying float vCyan;
                void main() {
                    float baseR = length(position);
                    vec3 dir = position / baseR;
                    float n = sin(position.x * 0.16 + uTime + aSeed) * cos(position.y * 0.16 + uTime * 0.8) * 0.5
                            + sin(position.z * 0.21 + uTime * 0.6 + aSeed) * 0.5;
                    float n2 = sin((position.x + position.y) * 0.09 - uTime * 0.5 + aSeed * 1.7);
                    float flow = n * 0.7 + n2 * 0.3;
                    float rad = baseR * (1.0 + 0.04 * sin(uTime * 1.1 + aSeed) + 0.02 * n2 + uVoice * (0.22 + 0.22 * aReact) * flow);
                    vec3 pos = dir * rad;
                    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
                    gl_Position = projectionMatrix * mv;
                    vDepth = clamp((64.0 + mv.z) / 28.0, 0.0, 1.0);
                    vNoise = flow;
                    vCyan = aCyan;
                    gl_PointSize = uSize * (0.35 + vDepth * 1.15) * (1.0 + uVoice * 0.5) * uPixel * (60.0 / -mv.z);
                }
            `,
            fragmentShader: `
                uniform float uVoice;
                varying float vDepth;
                varying float vNoise;
                varying float vCyan;
                vec3 hsl2rgb(vec3 c) {
                    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
                    return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
                }
                void main() {
                    vec2 uv = gl_PointCoord - 0.5;
                    float d = length(uv);
                    if (d > 0.5) discard;
                    float soft = smoothstep(0.5, 0.0, d);
                    float hueDeg = 199.0 + vNoise * 8.0 + vDepth * 6.0;
                    float l = clamp(0.50 + vDepth * 0.30 + uVoice * 0.14 + vCyan * 0.25, 0.0, 0.97);
                    float s = clamp(0.92 - vDepth * 0.22 - vCyan * 0.5, 0.2, 0.95);
                    vec3 col = hsl2rgb(vec3(hueDeg / 360.0, s, l));
                    float a = (0.18 + vDepth * 0.72) * (0.62 + uVoice * 0.38) * soft;
                    gl_FragColor = vec4(col, a);
                }
            `,
        });
        materialRef.current = mat;

        const points = new THREE.Points(geo, mat);
        scene.add(points);

        // 3. Loop de animación optimizado (pausar si está oculto)
        let animationId: number;
        let t = 0;
        function animate() {
            animationId = requestAnimationFrame(animate);
            if (document.hidden) return; // Ahorro total si no se está mirando la pestaña
            t += 0.016;

            const active = activeRef.current;
            const vol = volumeRef.current;
            const idle = 0.06 + 0.34 * Math.max(0, Math.sin(t * 1.6) * Math.sin(t * 0.55));
            const target = active ? Math.min(1, 0.14 + vol * 1.4) : idle;

            const u = mat.uniforms;
            u.uVoice.value += (target - u.uVoice.value) * 0.075;
            u.uTime.value = t;

            points.rotation.y += 0.0012 + u.uVoice.value * 0.006;
            points.rotation.x = Math.sin(t * 0.18) * 0.22;

            renderer.render(scene, camera);
        }
        animate();

        const handleResize = () => {
            if (!container) return;
            renderer.setSize(container.clientWidth, container.clientHeight);
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
        };
        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(container);

        return () => {
            cancelAnimationFrame(animationId);
            resizeObserver.disconnect();
            renderer.dispose();
            geo.dispose();
            mat.dispose();
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };
    }, []);

    // Mantener los refs sincronizados para que el loop lea el valor actual
    useEffect(() => {
        volumeRef.current = isActive ? Math.min(volumeLevel, 1.0) : 0;
        activeRef.current = isActive;
    }, [volumeLevel, isActive]);

    return (
        <div
            ref={containerRef}
            className="w-full h-full bg-transparent flex items-center justify-center relative pointer-events-none"
        />
    );
};
