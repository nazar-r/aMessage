import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const GlassBackground = (): any => {
  const containerRef = useRef<any>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth;
    let height = container.clientHeight;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 12);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // Environment map для відблисків на склі
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;

    // Світло
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 8, 6);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xbfe9ff, 1.5, 30);
    pointLight.position.set(-6, -3, 4);
    scene.add(pointLight);

    const createGlassMaterial = (color: any): any =>
      new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0,
        roughness: 0.05,
        transmission: 1,
        thickness: 1.5,
        ior: 1.5,
        reflectivity: 0.5,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        envMapIntensity: 1.2,
        transparent: true,
        opacity: 0.35,
      });

    const geometries: any[] = [
      new THREE.IcosahedronGeometry(1.4, 1),
      new THREE.SphereGeometry(1.2, 64, 64),
      new RoundedBoxGeometry(1.8, 1.8, 1.8, 6, 0.4),
      new THREE.TorusGeometry(1.1, 0.42, 32, 100),
      new THREE.CapsuleGeometry(0.7, 1.4, 8, 24),
    ];

    const colors = [0x9fd8ff, 0xbfe3ff, 0x76cff6, 0x0d72c5, 0xffffff];

    const positions = [
      [-4.5, 2.2, -2],
      [4.2, -1.5, -3],
      [-2.5, -2.8, -1],
      [3.5, 2.6, -4],
      [0.3, 0, -5],
    ];

    const meshes: any[] = geometries.map((geo, i) => {
      const mat = createGlassMaterial(colors[i % colors.length]);
      const mesh = new THREE.Mesh(geo, mat);
      const [x, y, z] = positions[i];
      mesh.position.set(x, y, z);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      scene.add(mesh);
      return mesh;
    });

    // Parallax під курсор — максимальна чутливість
    const mouse = { x: 0, y: 0 };
    const handleMouseMove = (e: any) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 6;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 6;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Анімація, жорстко прив'язана до 60fps
    const clock = new THREE.Clock();
    let frameId = 0;
    const frameInterval = 1 / 60;
    let accumulator = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      accumulator += delta;

      if (accumulator < frameInterval) return;
      accumulator = 0;

      const elapsed = clock.getElapsedTime();

      meshes.forEach((mesh, i) => {
        mesh.rotation.x += 0.0025 + i * 0.0004 + mouse.y * 0.012;
        mesh.rotation.y += 0.0035 + i * 0.0003 + mouse.x * 0.012;
        mesh.position.y += Math.sin(elapsed * 0.6 + i) * 0.0045;
      });

      camera.position.x += (mouse.x * 7 - camera.position.x) * 0.15;
      camera.position.y += (-mouse.y * 7 - camera.position.y) * 0.15;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      resizeObserver.disconnect();

      geometries.forEach((geo) => geo.dispose());
      meshes.forEach((mesh) => mesh.material.dispose());
      envTexture.dispose();
      pmremGenerator.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="bg-canvas" />;
};

export default GlassBackground;