/**
 * 3D Models Module
 * Manages Three.js scene and educational 3D models
 */

import * as THREE from 'three';

class ModelManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.activeModelGroup = new THREE.Group();
        this.currentModel = 'solar';

        // Gesture control state
        this.isDragging = false;
        this.isRotating = false;
        this.isZooming = false;

        // Rotation tracking
        this.rotationVelocity = { x: 0, y: 0 };
        this.lastGesturePos = { x: 0.5, y: 0.5 };

        // Zoom tracking
        this.baseScale = 1;
        this.targetScale = 1;
        this.lastPinchDistance = 0;

        // Model data for explanations
        this.modelData = null;
    }

    async initialize(width, height) {
        // Create scene
        this.scene = new THREE.Scene();

        // Camera
        const aspect = width / height;
        this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
        this.camera.position.z = 10;

        // Renderer with transparency
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 5, 5);
        this.scene.add(dirLight);

        const backLight = new THREE.DirectionalLight(0x8888ff, 0.3);
        backLight.position.set(-5, -5, -5);
        this.scene.add(backLight);

        // Add model group to scene
        this.scene.add(this.activeModelGroup);

        // Load explanation data
        try {
            const response = await fetch('data/explanations.json');
            this.modelData = await response.json();
        } catch (e) {
            console.warn('Could not load explanations:', e);
            this.modelData = {};
        }

        // Load default model
        this.loadModel('solar');
    }

    resize(width, height) {
        if (!this.camera || !this.renderer) return;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    loadModel(type) {
        // Clear current model
        while (this.activeModelGroup.children.length > 0) {
            const child = this.activeModelGroup.children[0];
            this.disposeObject(child);
            this.activeModelGroup.remove(child);
        }

        // Reset transforms
        this.activeModelGroup.rotation.set(0, 0, 0);
        this.activeModelGroup.position.set(0, 0, 0);
        this.activeModelGroup.scale.set(1, 1, 1);
        this.baseScale = 1;
        this.targetScale = 1;

        this.currentModel = type;

        switch (type) {
            case 'solar':
                this.createSolarSystem();
                break;
            case 'heart':
                this.createHeart();
                break;
            case 'eye':
                this.createEye();
                break;
            case 'reflection':
                this.createReflection();
                break;
            case 'none':
            default:
                break;
        }
    }

    disposeObject(obj) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
            if (Array.isArray(obj.material)) {
                obj.material.forEach(m => m.dispose());
            } else {
                obj.material.dispose();
            }
        }
        if (obj.children) {
            obj.children.forEach(child => this.disposeObject(child));
        }
    }

    createSolarSystem() {
        // Sun
        const sunGeo = new THREE.SphereGeometry(1.2, 32, 32);
        const sunMat = new THREE.MeshStandardMaterial({
            color: 0xffdd00,
            emissive: 0xff8800,
            emissiveIntensity: 0.6
        });
        const sun = new THREE.Mesh(sunGeo, sunMat);
        sun.name = 'sun';
        this.activeModelGroup.add(sun);

        // Sun glow
        const glowGeo = new THREE.SphereGeometry(1.5, 32, 32);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.2
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        sun.add(glow);

        // Mercury
        const mercuryGroup = new THREE.Group();
        const mercuryGeo = new THREE.SphereGeometry(0.15, 24, 24);
        const mercuryMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const mercury = new THREE.Mesh(mercuryGeo, mercuryMat);
        mercury.name = 'mercury';
        mercury.position.x = 2;
        mercuryGroup.add(mercury);
        this.activeModelGroup.add(mercuryGroup);

        // Earth
        const earthGroup = new THREE.Group();
        const earthGeo = new THREE.SphereGeometry(0.4, 32, 32);
        const earthMat = new THREE.MeshStandardMaterial({ color: 0x2244ff });
        const earth = new THREE.Mesh(earthGeo, earthMat);
        earth.name = 'earth';
        earth.position.x = 3.5;

        // Moon
        const moonGeo = new THREE.SphereGeometry(0.12, 16, 16);
        const moonMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
        const moon = new THREE.Mesh(moonGeo, moonMat);
        moon.name = 'moon';
        moon.position.x = 0.7;
        earth.add(moon);

        earthGroup.add(earth);
        this.activeModelGroup.add(earthGroup);

        // Saturn
        const saturnGroup = new THREE.Group();
        const saturnGeo = new THREE.SphereGeometry(0.5, 32, 32);
        const saturnMat = new THREE.MeshStandardMaterial({ color: 0xddaa66 });
        const saturn = new THREE.Mesh(saturnGeo, saturnMat);
        saturn.name = 'saturn';
        saturn.position.x = 5;

        // Saturn rings
        const ringGeo = new THREE.RingGeometry(0.7, 1.0, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xccbb88,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2.5;
        saturn.add(ring);

        saturnGroup.add(saturn);
        this.activeModelGroup.add(saturnGroup);

        // Store references for animation
        this.activeModelGroup.userData = {
            type: 'solar',
            mercuryGroup,
            earthGroup,
            earth,
            saturnGroup
        };
    }

    createHeart() {
        // Heart shape
        const x = 0, y = 0;
        const heartShape = new THREE.Shape();
        heartShape.moveTo(x + 5, y + 5);
        heartShape.bezierCurveTo(x + 5, y + 5, x + 4, y, x, y);
        heartShape.bezierCurveTo(x - 6, y, x - 6, y + 7, x - 6, y + 7);
        heartShape.bezierCurveTo(x - 6, y + 11, x - 3, y + 15.4, x + 5, y + 19);
        heartShape.bezierCurveTo(x + 12, y + 15.4, x + 16, y + 11, x + 16, y + 7);
        heartShape.bezierCurveTo(x + 16, y + 7, x + 16, y, x + 10, y);
        heartShape.bezierCurveTo(x + 7, y, x + 5, y + 5, x + 5, y + 5);

        const extrudeSettings = {
            depth: 2,
            bevelEnabled: true,
            bevelSegments: 3,
            steps: 2,
            bevelSize: 0.8,
            bevelThickness: 0.8
        };

        const heartGeo = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
        const heartMat = new THREE.MeshPhongMaterial({
            color: 0xcc0000,
            shininess: 80
        });
        const heart = new THREE.Mesh(heartGeo, heartMat);
        heart.name = 'heart';
        heart.scale.set(0.12, -0.12, 0.12);
        heart.position.y = 0.5;
        this.activeModelGroup.add(heart);

        // Aorta
        const aortaGeo = new THREE.CylinderGeometry(0.25, 0.3, 1.5, 16);
        const aortaMat = new THREE.MeshPhongMaterial({ color: 0xff4444 });
        const aorta = new THREE.Mesh(aortaGeo, aortaMat);
        aorta.name = 'aorta';
        aorta.position.set(0.2, 2, 0);
        this.activeModelGroup.add(aorta);

        // Pulmonary artery
        const pulGeo = new THREE.CylinderGeometry(0.2, 0.25, 1.2, 16);
        const pulMat = new THREE.MeshPhongMaterial({ color: 0x4444ff });
        const pulmonary = new THREE.Mesh(pulGeo, pulMat);
        pulmonary.name = 'pulmonary';
        pulmonary.position.set(-0.4, 1.8, 0);
        pulmonary.rotation.z = 0.3;
        this.activeModelGroup.add(pulmonary);

        // Vena cava
        const venaGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 16);
        const venaMat = new THREE.MeshPhongMaterial({ color: 0x2222aa });
        const vena = new THREE.Mesh(venaGeo, venaMat);
        vena.name = 'venaCava';
        vena.position.set(0.6, 1.9, 0);
        vena.rotation.z = -0.2;
        this.activeModelGroup.add(vena);

        this.activeModelGroup.userData = { type: 'heart', heart };
    }

    createEye() {
        // Sclera (white of eye)
        const scleraGeo = new THREE.SphereGeometry(1.5, 32, 32);
        const scleraMat = new THREE.MeshPhongMaterial({
            color: 0xfff8f0,
            shininess: 30
        });
        const sclera = new THREE.Mesh(scleraGeo, scleraMat);
        sclera.name = 'sclera';

        // Cornea (transparent dome)
        const corneaGeo = new THREE.SphereGeometry(0.8, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
        const corneaMat = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3,
            shininess: 100
        });
        const cornea = new THREE.Mesh(corneaGeo, corneaMat);
        cornea.name = 'cornea';
        cornea.position.z = 1.1;
        cornea.rotation.x = Math.PI / 2;
        sclera.add(cornea);

        // Iris
        const irisGeo = new THREE.CircleGeometry(0.55, 32);
        const irisMat = new THREE.MeshBasicMaterial({ color: 0x4a3728 });
        const iris = new THREE.Mesh(irisGeo, irisMat);
        iris.name = 'iris';
        iris.position.z = 1.42;
        sclera.add(iris);

        // Pupil
        const pupilGeo = new THREE.CircleGeometry(0.2, 32);
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const pupil = new THREE.Mesh(pupilGeo, pupilMat);
        pupil.name = 'pupil';
        pupil.position.z = 1.44;
        sclera.add(pupil);

        // Blood vessels (simple lines)
        const vesselMat = new THREE.LineBasicMaterial({ color: 0xcc6666, linewidth: 1 });
        for (let i = 0; i < 5; i++) {
            const points = [];
            const angle = (Math.PI / 6) + (i * Math.PI / 10);
            points.push(new THREE.Vector3(Math.cos(angle) * 0.8, Math.sin(angle) * 0.8, 1.3));
            points.push(new THREE.Vector3(Math.cos(angle) * 1.2, Math.sin(angle) * 1.2, 0.8));
            const vesselGeo = new THREE.BufferGeometry().setFromPoints(points);
            const vessel = new THREE.Line(vesselGeo, vesselMat);
            sclera.add(vessel);
        }

        this.activeModelGroup.add(sclera);
        this.activeModelGroup.userData = { type: 'eye', pupil };
    }

    createReflection() {
        // Mirror surface
        const mirrorGeo = new THREE.BoxGeometry(4, 3, 0.1);
        const mirrorMat = new THREE.MeshPhongMaterial({
            color: 0x88ccff,
            shininess: 100,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        const mirror = new THREE.Mesh(mirrorGeo, mirrorMat);
        mirror.name = 'mirror';
        this.activeModelGroup.add(mirror);

        // Mirror frame
        const frameGeo = new THREE.BoxGeometry(4.3, 3.3, 0.2);
        const frameMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.z = -0.05;
        this.activeModelGroup.add(frame);

        // Light rays material
        const rayMat = new THREE.LineBasicMaterial({
            color: 0xffff00,
            linewidth: 2
        });

        // Incident ray
        const incidentPoints = [
            new THREE.Vector3(-3, 2.5, 3),
            new THREE.Vector3(0, 0, 0)
        ];
        const incidentGeo = new THREE.BufferGeometry().setFromPoints(incidentPoints);
        const incidentRay = new THREE.Line(incidentGeo, rayMat);
        incidentRay.name = 'incident';
        this.activeModelGroup.add(incidentRay);

        // Reflected ray
        const reflectedPoints = [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(3, 2.5, 3)
        ];
        const reflectedGeo = new THREE.BufferGeometry().setFromPoints(reflectedPoints);
        const reflectedRay = new THREE.Line(reflectedGeo, rayMat);
        reflectedRay.name = 'reflected';
        this.activeModelGroup.add(reflectedRay);

        // Normal line
        const normalMat = new THREE.LineDashedMaterial({
            color: 0x00ff00,
            dashSize: 0.2,
            gapSize: 0.1
        });
        const normalPoints = [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 2.5)
        ];
        const normalGeo = new THREE.BufferGeometry().setFromPoints(normalPoints);
        const normal = new THREE.Line(normalGeo, normalMat);
        normal.name = 'normal';
        normal.computeLineDistances();
        this.activeModelGroup.add(normal);

        // Arrow heads for rays
        const arrowGeo = new THREE.ConeGeometry(0.1, 0.3, 8);
        const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });

        // Incident arrow
        const incArrow = new THREE.Mesh(arrowGeo, arrowMat);
        incArrow.position.set(-1.5, 1.25, 1.5);
        incArrow.rotation.set(0.7, 0, 0.7);
        this.activeModelGroup.add(incArrow);

        // Reflected arrow
        const refArrow = new THREE.Mesh(arrowGeo, arrowMat);
        refArrow.position.set(1.5, 1.25, 1.5);
        refArrow.rotation.set(-0.7, 0, 0.7);
        this.activeModelGroup.add(refArrow);

        // Labels
        this.activeModelGroup.userData = { type: 'reflection' };
    }

    update(deltaTime, gesture, gesturePos, pinchDistance) {
        if (!this.activeModelGroup) return;

        const time = performance.now() * 0.001;

        // Handle gesture-based controls
        switch (gesture) {
            case 'peace': // Rotate
                this.handleRotation(gesturePos);
                break;
            case 'pinch': // Zoom
                this.handleZoom(pinchDistance);
                break;
            case 'fist': // Move
                this.handleMove(gesturePos);
                break;
            case 'palm': // Stop
                this.isDragging = false;
                this.isRotating = false;
                this.isZooming = false;
                break;
        }

        // Smooth scale interpolation
        const currentScale = this.activeModelGroup.scale.x;
        const newScale = currentScale + (this.targetScale - currentScale) * 0.1;
        this.activeModelGroup.scale.setScalar(Math.max(0.3, Math.min(3, newScale)));

        // Auto-rotate when idle (not controlling)
        if (gesture === 'none' || gesture === 'point' || gesture === 'palm') {
            if (this.currentModel !== 'reflection') {
                this.activeModelGroup.rotation.y += 0.003;
            }
        }

        // Model-specific animations
        this.animateModels(time);

        this.lastGesturePos = { ...gesturePos };
    }

    handleRotation(gesturePos) {
        if (!this.isRotating) {
            this.isRotating = true;
            this.lastGesturePos = { ...gesturePos };
            return;
        }

        const deltaX = (gesturePos.x - this.lastGesturePos.x) * 5;
        const deltaY = (gesturePos.y - this.lastGesturePos.y) * 5;

        this.activeModelGroup.rotation.y += deltaX;
        this.activeModelGroup.rotation.x += deltaY;

        // Clamp vertical rotation
        this.activeModelGroup.rotation.x = Math.max(-Math.PI / 2,
            Math.min(Math.PI / 2, this.activeModelGroup.rotation.x));
    }

    handleZoom(pinchDistance) {
        if (!this.isZooming) {
            this.isZooming = true;
            this.lastPinchDistance = pinchDistance;
            return;
        }

        const delta = (this.lastPinchDistance - pinchDistance) * 15;
        this.targetScale = Math.max(0.3, Math.min(3, this.targetScale + delta));
        this.lastPinchDistance = pinchDistance;
    }

    handleMove(gesturePos) {
        if (!this.isDragging) {
            this.isDragging = true;
            this.lastGesturePos = { ...gesturePos };
            return;
        }

        // Map gesture position to 3D world
        const ndcX = (gesturePos.x - 0.5) * 10;
        const ndcY = -(gesturePos.y - 0.5) * 7;

        // Smooth interpolation
        this.activeModelGroup.position.x += (ndcX - this.activeModelGroup.position.x) * 0.15;
        this.activeModelGroup.position.y += (ndcY - this.activeModelGroup.position.y) * 0.15;
    }

    animateModels(time) {
        const userData = this.activeModelGroup.userData;

        if (userData.type === 'solar') {
            // Planet orbits
            if (userData.mercuryGroup) {
                userData.mercuryGroup.rotation.y = time * 2;
            }
            if (userData.earthGroup) {
                userData.earthGroup.rotation.y = time * 0.8;
            }
            if (userData.earth) {
                userData.earth.rotation.y = time * 1.5;
            }
            if (userData.saturnGroup) {
                userData.saturnGroup.rotation.y = time * 0.4;
            }
        }

        if (userData.type === 'heart' && userData.heart) {
            // Heartbeat animation
            const beat = 0.12 + Math.sin(time * 6) * 0.008;
            userData.heart.scale.set(beat, -beat, beat);
        }

        if (userData.type === 'eye' && userData.pupil) {
            // Subtle pupil dilation
            const dilate = 0.2 + Math.sin(time * 2) * 0.03;
            userData.pupil.scale.setScalar(dilate / 0.2);
        }
    }

    render() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
            return this.renderer.domElement;
        }
        return null;
    }

    getModelInfo(modelType) {
        if (this.modelData && this.modelData[modelType]) {
            return this.modelData[modelType];
        }
        return null;
    }

    getCurrentModel() {
        return this.currentModel;
    }
}

export default ModelManager;
