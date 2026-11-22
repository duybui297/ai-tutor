// Nhân vật 3D "Bông" — chú thỏ dựng bằng three.js, không cần file mô hình.
// Nếu anh đặt một nhân vật VRM (làm bằng VRoid Studio, miễn phí) vào models/avatar.vrm
// thì app sẽ tự dùng nhân vật đó thay cho Bông.
import * as THREE from 'three';

const lerp = (a, b, t) => a + (b - a) * t;
const mat = (color, roughness = 0.55, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, ...extra });

export class Avatar {
  constructor(container) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    this.camera.position.set(0, 0.05, 5.6);
    this.camera.lookAt(0, -0.15, 0);

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xb8c8e8, 1.7));
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(2, 3, 4);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xffe7f3, 0.6);
    rim.position.set(-3, 2, -2);
    this.scene.add(rim);

    this.mouth = { open: 0, wide: 0.5 };
    this.mouthSource = null;
    this.emotion = 'neutral';
    this.emotionT = 0;
    this.listening = false;
    this.blinkT = 0;
    this.nextBlink = 2;

    this._buildBunny();
    this.clock = new THREE.Clock();
    new ResizeObserver(() => this._resize()).observe(container);
    this._resize();
    this.renderer.setAnimationLoop(() => this._tick());
    this._tryLoadVRM();
  }

  _buildBunny() {
    const root = new THREE.Group();
    const fur = mat(0xf4f7ff, 0.7);
    const blue = mat(0x7cc8ff, 0.5);
    const pink = mat(0xffb3cf, 0.6);
    const dark = mat(0x1d1f33, 0.25);
    const white = mat(0xffffff, 0.2);

    // thân + áo
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.58, 48, 32), blue);
    body.scale.set(1, 0.92, 0.88);
    body.position.y = -0.82;
    root.add(body);
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.36, 32, 24), fur);
    belly.scale.set(1, 1, 0.5);
    belly.position.set(0, -0.86, 0.38);
    root.add(belly);

    // tay, chân
    const armGeo = new THREE.SphereGeometry(0.17, 24, 16);
    this.armL = new THREE.Mesh(armGeo, fur);
    this.armR = new THREE.Mesh(armGeo, fur);
    this.armL.position.set(-0.58, -0.78, 0.12);
    this.armR.position.set(0.58, -0.78, 0.12);
    root.add(this.armL, this.armR);
    const footGeo = new THREE.SphereGeometry(0.2, 24, 16);
    for (const x of [-0.26, 0.26]) {
      const f = new THREE.Mesh(footGeo, fur);
      f.scale.set(1, 0.55, 1.3);
      f.position.set(x, -1.36, 0.18);
      root.add(f);
    }

    // đầu
    const head = new THREE.Group();
    head.position.y = 0.25;
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.7, 64, 48), fur);
    head.add(skull);

    // tai
    this.ears = [];
    for (const side of [-1, 1]) {
      const ear = new THREE.Group();
      ear.position.set(0.28 * side, 0.55, -0.05);
      const outer = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.55, 8, 20), fur);
      outer.position.y = 0.38;
      const inner = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.42, 8, 16), pink);
      inner.position.set(0, 0.38, 0.08);
      inner.scale.z = 0.5;
      ear.add(outer, inner);
      ear.rotation.z = -0.22 * side;
      ear.userData.side = side;
      head.add(ear);
      this.ears.push(ear);
    }

    // mắt
    this.eyes = [];
    for (const side of [-1, 1]) {
      const eye = new THREE.Group();
      eye.position.set(0.24 * side, 0.07, 0.63);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.105, 32, 24), dark);
      ball.scale.z = 0.6;
      const shine = new THREE.Mesh(new THREE.SphereGeometry(0.032, 16, 12), white);
      shine.position.set(0.03, 0.04, 0.06);
      eye.add(ball, shine);
      head.add(eye);
      this.eyes.push(eye);
    }

    // má hồng
    for (const side of [-1, 1]) {
      const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.09, 24, 16), mat(0xff9fc2, 0.8, { transparent: true, opacity: 0.75 }));
      cheek.scale.set(1.3, 0.8, 0.3);
      cheek.position.set(0.42 * side, -0.12, 0.53);
      head.add(cheek);
    }

    // mũi
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 12), pink);
    nose.scale.set(1.3, 0.9, 0.7);
    nose.position.set(0, -0.06, 0.69);
    head.add(nose);

    // miệng
    this.mouthG = new THREE.Group();
    this.mouthG.position.set(0, -0.2, 0.665);
    const cavity = new THREE.Mesh(new THREE.SphereGeometry(0.1, 32, 20), mat(0x7a2238, 0.6));
    cavity.scale.z = 0.3;
    const tongue = new THREE.Mesh(new THREE.SphereGeometry(0.055, 20, 14), mat(0xff7a9a, 0.6));
    tongue.position.set(0, -0.04, 0.012);
    tongue.scale.set(1, 0.5, 0.35);
    this.mouthG.add(cavity, tongue);
    head.add(this.mouthG);

    root.add(head);
    this.head = head;

    // vòng sáng khi đang nghe
    this.ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.8, 0.035, 12, 64),
      new THREE.MeshStandardMaterial({ color: 0x4ade80, emissive: 0x22c55e, emissiveIntensity: 1.2 })
    );
    this.ring.rotation.x = Math.PI / 2;
    this.ring.position.y = -1.45;
    this.ring.visible = false;
    root.add(this.ring);

    this.root = root;
    this.scene.add(root);
  }

  async _tryLoadVRM() {
    try {
      const head = await fetch('models/avatar.vrm', { method: 'HEAD' });
      if (!head.ok) return;
      const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
      const { VRMLoaderPlugin, VRMUtils } = await import('@pixiv/three-vrm');
      const loader = new GLTFLoader();
      loader.register((parser) => new VRMLoaderPlugin(parser));
      const gltf = await loader.loadAsync('models/avatar.vrm');
      const vrm = gltf.userData.vrm;
      if (!vrm) return;
      VRMUtils.rotateVRM0(vrm);
      this.scene.add(vrm.scene);
      this.root.visible = false;
      this.vrm = vrm;
      // hạ tay xuống cho tự nhiên
      const h = vrm.humanoid;
      h.getNormalizedBoneNode('leftUpperArm')?.rotation.set(0, 0, -1.2);
      h.getNormalizedBoneNode('rightUpperArm')?.rotation.set(0, 0, 1.2);
      // khung hình nửa người
      const headNode = h.getNormalizedBoneNode('head');
      const y = headNode ? headNode.getWorldPosition(new THREE.Vector3()).y : 1.3;
      this.camera.position.set(0, y - 0.05, 1.5);
      this.camera.lookAt(0, y - 0.15, 0);
    } catch (e) {
      console.warn('Không tải được models/avatar.vrm, dùng thỏ Bông.', e);
    }
  }

  setEmotion(e) {
    this.emotion = e || 'neutral';
    this.emotionT = 0;
  }

  setListening(on) {
    this.listening = on;
  }

  _resize() {
    const w = this.container.clientWidth || 300;
    const h = this.container.clientHeight || 300;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  _tick() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;
    this.emotionT += dt;

    // nhép môi
    const src = this.mouthSource ? this.mouthSource() : null;
    const tgt = src || { open: 0, wide: 0.5 };
    this.mouth.open = lerp(this.mouth.open, tgt.open, 0.4);
    this.mouth.wide = lerp(this.mouth.wide, tgt.wide, 0.4);

    // chớp mắt
    if (t > this.nextBlink) {
      this.blinkT = 0.14;
      this.nextBlink = t + 2.2 + Math.random() * 3;
    }
    const blinking = this.blinkT > 0;
    if (blinking) this.blinkT -= dt;

    const decay = (d) => Math.max(0, 1 - this.emotionT / d);
    const em = this.emotion;

    if (this.vrm) {
      const ex = this.vrm.expressionManager;
      if (ex) {
        const o = this.mouth.open;
        ex.setValue('aa', o * (1 - Math.max(0, this.mouth.wide - 0.6)));
        ex.setValue('ih', Math.max(0, this.mouth.wide - 0.6) * o * 2);
        ex.setValue('ou', this.mouth.wide < 0.3 ? o : 0);
        ex.setValue('blink', blinking ? 1 : 0);
        ex.setValue('happy', em === 'happy' || em === 'cheer' ? 0.6 * decay(2.5) : 0);
      }
      const neck = this.vrm.humanoid.getNormalizedBoneNode('head');
      if (neck) {
        neck.rotation.z = lerp(neck.rotation.z, em === 'think' ? 0.15 : Math.sin(t * 0.7) * 0.03, 0.1);
        neck.rotation.x = em === 'encourage' ? Math.sin(this.emotionT * 7) * 0.1 * decay(1.2) : lerp(neck.rotation.x, 0, 0.1);
      }
      this.vrm.update(dt);
      this.renderer.render(this.scene, this.camera);
      return;
    }

    // miệng thỏ
    this.mouthG.scale.set(0.7 + this.mouth.wide * 0.7, 0.13 + this.mouth.open * 1.1, 1);
    for (const eye of this.eyes) eye.scale.y = lerp(eye.scale.y, blinking ? 0.1 : 1, 0.5);

    // nhún nhẹ khi đứng chờ
    let y = Math.sin(t * 2) * 0.03;
    let spin = 0;
    let armUp = 0;
    if (em === 'happy') y += Math.abs(Math.sin(this.emotionT * 8)) * 0.08 * decay(1.5);
    if (em === 'cheer') {
      y += Math.abs(Math.sin(this.emotionT * 6)) * 0.25 * decay(2);
      spin = Math.sin(this.emotionT * 4) * 0.35 * decay(2);
      armUp = decay(2);
    }
    this.root.position.y = y;
    this.root.rotation.y = lerp(this.root.rotation.y, spin + Math.sin(t * 0.6) * 0.08, 0.15);

    const tilt = em === 'think' ? 0.18 : Math.sin(t * 0.9) * 0.03;
    this.head.rotation.z = lerp(this.head.rotation.z, tilt, 0.1);
    this.head.rotation.x = em === 'encourage' ? Math.sin(this.emotionT * 7) * 0.12 * decay(1.2) : lerp(this.head.rotation.x, 0, 0.1);

    for (const arm of [this.armL, this.armR]) {
      arm.position.y = lerp(arm.position.y, -0.78 + armUp * 0.55, 0.2);
    }

    // tai dựng lên khi nghe
    for (const ear of this.ears) {
      const base = this.listening ? -0.05 : -0.22;
      ear.rotation.z = lerp(ear.rotation.z, base * ear.userData.side + Math.sin(t * 3 + ear.userData.side) * 0.03, 0.15);
    }
    this.ring.visible = this.listening;
    if (this.listening) this.ring.scale.setScalar(1 + Math.sin(t * 6) * 0.05);

    this.renderer.render(this.scene, this.camera);
  }
}
