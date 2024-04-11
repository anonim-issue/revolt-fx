'use strict';

var PIXI = require('pixi.js');

function _interopNamespaceDefault(e) {
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n.default = e;
    return Object.freeze(n);
}

var PIXI__namespace = /*#__PURE__*/_interopNamespaceDefault(PIXI);

var ComponentType = /* @__PURE__ */ ((ComponentType2) => {
  ComponentType2[ComponentType2["Sprite"] = 0] = "Sprite";
  ComponentType2[ComponentType2["MovieClip"] = 1] = "MovieClip";
  return ComponentType2;
})(ComponentType || {});

class LinkedList {
  constructor() {
    this.__length = 0;
  }
  // *********************************************************************************************
  // * Public																                       *
  // *********************************************************************************************
  get length() {
    return this.__length;
  }
  add(node) {
    if (this.first == null) {
      this.first = this.last = node;
    } else {
      node.prev = this.last;
      this.last.next = node;
      this.last = node;
    }
    node.list = this;
    this.__length++;
    return this;
  }
  remove(node) {
    if (node.list == null) {
      return;
    }
    if (this.first === this.last) {
      this.first = this.last = null;
    } else if (this.__length > 0) {
      if (node === this.last) {
        node.prev.next = null;
        this.last = node.prev;
      } else if (node === this.first) {
        node.next.prev = null;
        this.first = node.next;
      } else {
        node.next.prev = node.prev;
        node.prev.next = node.next;
      }
    }
    node.next = node.prev = node.list = null;
    this.__length--;
    return this;
  }
  clear() {
    if (!this.first)
      return;
    let node = this.first;
    while (node) {
      let next = node.next;
      node.next = node.prev = node.list = null;
      node = next;
    }
    this.first = this.last = null;
  }
  toArray() {
    const ret = [];
    if (!this.first)
      return ret;
    let node = this.first;
    while (node) {
      ret.push(node);
      node = node.next;
    }
    return ret;
  }
}
class Node {
  constructor(data) {
    this.data = data;
  }
  update(dt) {
  }
  dispose() {
  }
}

class BaseEffect extends Node {
  constructor(componentId) {
    super();
    this.componentId = componentId;
    this.exhausted = false;
    this.completed = false;
    this.name = "";
    this.endTime = 0;
    this._x = 0;
    this._y = 0;
    this._rotation = 0;
    this._alpha = 0;
    this._scale = new PIXI__namespace.Point();
    this._time = 0;
    this._active = false;
    this.__recycled = true;
  }
  // *********************************************************************************************
  // * Public																					                                           *
  // *********************************************************************************************
  update(dt) {
  }
  recycle() {
  }
  get active() {
    return this._active;
  }
  get scale() {
    return this._scale;
  }
  set scale(value) {
    this._scale = value;
  }
  get alpha() {
    return this._alpha;
  }
  set alpha(value) {
    this._alpha = value;
  }
  set rotation(value) {
    this._rotation = value;
  }
  get rotation() {
    return this._rotation;
  }
  get y() {
    return this._y;
  }
  set y(value) {
    this._y = value;
  }
  get x() {
    return this._x;
  }
  set x(value) {
    this._x = value;
  }
  // *********************************************************************************************
  // * internal										                                        										   *
  // *********************************************************************************************
  __applySettings(value) {
  }
}

class Rnd {
  static float(min, max) {
    return Math.random() * (max - min) + min;
  }
  static bool(chance = 0.5) {
    return Math.random() < chance;
  }
  static sign(chance = 0.5) {
    return Math.random() < chance ? 1 : -1;
  }
  static bit(chance = 0.5) {
    return Math.random() < chance ? 1 : 0;
  }
  static integer(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  }
}

class FXSignal {
  constructor() {
    this.__hasCallback = false;
    this._list = new LinkedList();
  }
  add(callback, scope, callRate) {
    this._list.add(new Node(new FXSignalListener(callback, scope, false, callRate)));
    this.__hasCallback = true;
  }
  addOnce(callback, scope) {
    this._list.add(new Node(new FXSignalListener(callback, scope, true)));
    this.__hasCallback = true;
  }
  dispatch(...params) {
    const list = this._list;
    let node = list.first;
    let next;
    while (node) {
      next = node.next;
      let call = true;
      const data = node.data;
      if (data.callRate) {
        if (data.calls % data.callRate != 0) {
          call = false;
        }
      }
      if (call) {
        data.callback.apply(data.scope, params);
        if (data.once) {
          list.remove(node);
        }
      }
      node = next;
    }
    this.__hasCallback = list.__length > 0;
  }
  remove(callback) {
    const list = this._list;
    let node = list.first;
    let next;
    while (node) {
      next = node.next;
      if (node.data.callback === callback) {
        list.remove(node);
        return;
      }
      node = next;
    }
    this.__hasCallback = list.__length > 0;
  }
  removeAll() {
    this._list.clear();
    this.__hasCallback = false;
  }
}
class FXSignalListener {
  constructor(callback, scope, once, callRate) {
    this.callback = callback;
    this.scope = scope;
    this.once = once;
    this.callRate = callRate;
    this.calls = 0;
  }
}

class ParticleEmitter extends BaseEffect {
  constructor(componentId) {
    super(componentId);
    this.targetOffset = 0;
    this.autoRecycleOnComplete = true;
    this._particles = new LinkedList();
    this._particleCount = 0;
    this._childEmitters = [];
    this._hasChildEmitters = false;
    this._paused = false;
    this.__adoptRotation = false;
    this.__on = {
      started: new FXSignal(),
      completed: new FXSignal(),
      exhausted: new FXSignal(),
      particleUpdated: new FXSignal(),
      particleSpawned: new FXSignal(),
      particleBounced: new FXSignal(),
      particleDied: new FXSignal()
    };
  }
  // *********************************************************************************************
  // * Public																                                        					   *
  // *********************************************************************************************
  init(container, autoStart = true, scaleMod = 1) {
    this.container = container;
    this.core.__scaleMod = this._scaleMod = scaleMod;
    if (autoStart)
      this.start();
    return this;
  }
  start() {
    if (this._active)
      return this;
    const t = Date.now();
    const s = this.settings;
    const RX = this.__fx;
    RX.emitterCount++;
    this.infinite = s.infinite;
    this._time = Number.MAX_VALUE;
    if (s.duration > 0) {
      this.endTime = t + s.duration * 1e3;
    } else {
      this.endTime = s.duration;
    }
    this._nextSpawnTime = 0;
    this._particleCount = 0;
    this._active = true;
    this.exhausted = this.completed = false;
    RX.__addActiveEffect(this);
    let l = s.childs.length;
    this._hasChildEmitters = l > 0;
    if (this._hasChildEmitters) {
      while (--l > -1) {
        const def = s.childs[l];
        const em = RX.getParticleEmitterById(def.id);
        const container = RX.__containers[em.settings.containerId] || this.container;
        em.init(container, true, (def.scale || 1) * (this._scaleMod || 1));
        if (def.adoptRotation) {
          em.rotation = this._rotation;
          em.__adoptRotation = true;
        }
        em.__parent = this;
        this._childEmitters.push(em);
      }
    }
    this.rotation = this._rotation;
    if (this.__on.started.__hasCallback) {
      this.__on.started.dispatch(this);
    }
    return this;
  }
  stop(waitForParticles = true) {
    if (waitForParticles) {
      this.exhausted = true;
      if (this._hasChildEmitters) {
        this.stopChildEmitters(true);
      }
    } else {
      if (this.__on.completed.__hasCallback) {
        this.__on.completed.dispatch(this);
      }
      if (this.autoRecycleOnComplete) {
        this.recycle();
      } else {
        this.recycleParticles();
        this.completed = true;
        this._active = false;
        this.__fx.__removeActiveEffect(this);
      }
    }
  }
  update(dt) {
    if (!this._active)
      return this;
    const t = Date.now();
    const s = this.settings;
    if (!this.exhausted) {
      if (this.settings.autoRotation !== 0) {
        this.rotation += s.autoRotation * (dt / 0.016666);
      }
      if (this.target) {
        this.rotation = this.target.rotation;
        if (this.targetOffset == 0) {
          this.x = this.target.x;
          this.y = this.target.y;
        } else {
          this.x = this.target.x + Math.cos(this._rotation) * this.targetOffset;
          this.y = this.target.y + Math.sin(this._rotation) * this.targetOffset;
        }
      }
      if (this.endTime == 0 && !this.infinite) {
        this.spawn();
        this.exhausted = true;
      } else if (this.infinite || t < this.endTime) {
        this._time += dt;
        if (this._time >= this._nextSpawnTime) {
          this._time = 0;
          this.spawn();
          this._nextSpawnTime = this._time + Rnd.float(s.spawnFrequencyMin, s.spawnFrequencyMax);
        }
      } else {
        this.exhausted = true;
        if (this.__on.exhausted.__hasCallback) {
          this.__on.exhausted.dispatch(this);
        }
      }
    } else {
      if (this._particleCount == 0) {
        this._active = false;
        this.completed = true;
        if (this.__on.completed.__hasCallback) {
          this.__on.completed.dispatch(this);
        }
        this.__fx.__removeActiveEffect(this);
        if (this.autoRecycleOnComplete)
          this.recycle();
      }
    }
    const list = this._particles;
    let node = list.first;
    let next;
    while (node) {
      next = node.next;
      node.update(dt);
      node = next;
    }
    return this;
  }
  spawn() {
    if (this._paused)
      return this;
    const s = this.settings;
    const fx = this.__fx;
    let n = Rnd.integer(s.spawnCountMin, s.spawnCountMax) * fx.particleFac;
    this.core.prepare(n);
    while (--n > -1) {
      if (this._particleCount >= s.maxParticles || fx.particleCount >= fx.maxParticles)
        return this;
      const ps = s.particleSettings;
      const p = fx.__getParticle();
      let component;
      switch (ps.componentType) {
        case 0:
          p.componentId = ps.componentId;
          component = fx.__getSprite(p.componentId);
          break;
        case 1:
          p.componentId = ps.componentId;
          component = fx.__getMovieClip(p.componentId);
          if (ps.componentParams) {
            component.loop = ps.componentParams.loop == null || !ps.componentParams.loop ? false : true;
            component.animationSpeed = Rnd.float(ps.componentParams.animationSpeedMin || 1, ps.componentParams.animationSpeedMax || 1);
          }
          component.gotoAndPlay(0);
          break;
      }
      component.anchor.set(ps.componentParams.anchorX, ps.componentParams.anchorY);
      p.component = component;
      this.core.emit(p);
      p.init(this, ps, this._scaleMod);
      this._particles.add(p);
      this._particleCount++;
      fx.particleCount++;
    }
    this.core.step();
    this._nextSpawnTime = Rnd.float(s.spawnFrequencyMin, s.spawnFrequencyMax);
    return this;
  }
  recycle() {
    if (this.__recycled)
      return;
    if (this.__parent) {
      this.__parent.__removeChildEmitter(this);
      this.__parent = void 0;
    }
    this.recycleParticles();
    this.settings = void 0;
    this._active = false;
    this._paused = false;
    this.completed = true;
    this._x = this._y = this._rotation = 0;
    if (this._hasChildEmitters) {
      this.stopChildEmitters(true);
      this._childEmitters.length = 0;
      this._hasChildEmitters = false;
    }
    this.__fx.emitterCount--;
    this.__fx.__recycleEmitter(this);
    this.__recycled = true;
    this.__adoptRotation = false;
    this.core = null;
    this.target = null;
    this.name = null;
    const on = this.__on;
    if (on.completed.__hasCallback)
      on.completed.removeAll();
    if (on.started.__hasCallback)
      on.started.removeAll();
    if (on.exhausted.__hasCallback)
      on.exhausted.removeAll();
    if (on.particleBounced.__hasCallback)
      on.particleBounced.removeAll();
    if (on.particleDied.__hasCallback)
      on.particleDied.removeAll();
    if (on.particleSpawned.__hasCallback)
      on.particleSpawned.removeAll();
    if (on.particleUpdated.__hasCallback)
      on.particleUpdated.removeAll();
  }
  dispose() {
    const list = this._particles;
    let node = list.first;
    let next;
    while (node) {
      next = node.next;
      node.recycle();
      node = next;
    }
    list.clear();
    this.__recycled = true;
    if (this._hasChildEmitters) {
      this.stopChildEmitters(false);
    }
    this.__fx.particleCount -= this._particleCount;
    this._particles = null;
    this.componentId = null;
    this.settings = null;
    this._active = false;
    this.completed = true;
    this._childEmitters = null;
    if (this.core) {
      this.core.dispose();
    }
    this.core = null;
    this.target = null;
    this.name = null;
    const on = this.__on;
    on.completed.removeAll();
    on.started.removeAll();
    on.exhausted.removeAll();
    on.particleBounced.removeAll();
    on.particleDied.removeAll();
    on.particleSpawned.removeAll();
    on.particleUpdated.removeAll();
    this.__parent = null;
    this.__fx.__removeActiveEffect(this);
    this.__fx = null;
  }
  get x() {
    return this._x;
  }
  set x(value) {
    this._x = this.core.x = value;
    if (!this._xPosIntialized) {
      this.core.__x = value;
      this._xPosIntialized = true;
    }
    if (this._hasChildEmitters) {
      const childs = this._childEmitters;
      let l = childs.length;
      while (--l > -1) {
        childs[l].x = value;
      }
    }
  }
  get y() {
    return this._y;
  }
  set y(value) {
    this._y = this.core.y = value;
    if (!this._yPosIntialized) {
      this.core.__y = value;
      this._yPosIntialized = true;
    }
    if (this._hasChildEmitters) {
      const childs = this._childEmitters;
      let l = childs.length;
      while (--l > -1) {
        childs[l].y = value;
      }
    }
  }
  set rotation(value) {
    this._rotation = this.core.rotation = value;
    if (this._hasChildEmitters) {
      const childs = this._childEmitters;
      let l = childs.length;
      while (--l > -1) {
        const child = childs[l];
        if (child.__adoptRotation) {
          child.rotation = child.settings.rotation + value;
        }
      }
    }
  }
  get rotation() {
    return this._rotation;
  }
  get paused() {
    return this._paused;
  }
  set paused(value) {
    this._paused = value;
    if (this._hasChildEmitters) {
      const childs = this._childEmitters;
      let l = childs.length;
      while (--l > -1) {
        childs[l].paused = value;
      }
    }
  }
  get on() {
    return this.__on;
  }
  // *********************************************************************************************
  // * Private																				                                           *
  // *********************************************************************************************
  recycleParticles() {
    let node = this._particles.first;
    let next;
    while (node) {
      next = node.next;
      node.recycle();
      node = next;
    }
    this._particles.clear();
    this.__fx.particleCount -= this._particleCount;
  }
  stopChildEmitters(waitForParticles) {
    const childs = this._childEmitters;
    let l = childs.length;
    while (--l > -1) {
      childs[l].stop(waitForParticles);
    }
  }
  // *********************************************************************************************
  // * Internal																				                                           *
  // *********************************************************************************************
  __removeParticle(particle) {
    if (particle.useSpawns && this._spawnOnComplete) {
      this.__subSpawn(particle, this.settings.particleSettings.spawn.onComplete);
    }
    this._particles.remove(particle);
    this._particleCount--;
    this.__fx.particleCount--;
    particle.recycle();
  }
  __removeChildEmitter(emitter) {
    const index = this._childEmitters.indexOf(emitter);
    if (index > -1) {
      this._childEmitters.splice(index, 1);
      if (this._childEmitters.length == 0)
        this._hasChildEmitters = false;
    }
  }
  __subSpawn(particle, list) {
    const fx = this.__fx;
    if (list) {
      let l = list.length;
      while (--l > -1) {
        const def = list[l];
        let component;
        let container;
        switch (def.type) {
          case 0:
            component = fx.getParticleEmitterById(def.id);
            container = fx.__containers[component.settings.containerId] || this.container;
            component.init(container, true, (def.scale || 1) * this._scaleMod);
            if (def.adoptRotation) {
              component.rotation = particle.component.rotation + component.settings.rotation;
              component.__adoptRotation = true;
            } else {
              component.rotation = component.settings.rotation;
            }
            break;
          case 1:
            component = fx.getEffectSequenceById(def.id);
            container = fx.__containers[component.settings.containerId] || this.container;
            component.init(container, 0, true, (def.scale || 1) * this._scaleMod);
            if (def.adoptRotation) {
              component.rotation = particle.component.rotation;
            }
            break;
        }
        component.x = particle.component.x;
        component.y = particle.component.y;
      }
    }
  }
  __applySettings(value) {
    const fx = this.__fx;
    this.__recycled = this._xPosIntialized = this._yPosIntialized = false;
    this.settings = value;
    this.core = fx.__getEmitterCore(value.core.type, this);
    this.core.init(this);
    this.rotation = value.rotation;
    this.name = value.name;
    this._spawnOnComplete = value.particleSettings.spawn.onComplete.length > 0;
    this._childEmitters.length = 0;
  }
  __setCore(type) {
    this.core = this.__fx.__getEmitterCore(type, this);
    this.core.init(this);
    this.core.__scaleMod = this._scaleMod;
    this._xPosIntialized = this._yPosIntialized = false;
  }
  // *********************************************************************************************
  // * Private																	                                        			   *
  // *********************************************************************************************
  // *********************************************************************************************
  // * Events															                                        						   *
  // *********************************************************************************************
}

var EffectSequenceComponentType = /* @__PURE__ */ ((EffectSequenceComponentType2) => {
  EffectSequenceComponentType2[EffectSequenceComponentType2["Sprite"] = 0] = "Sprite";
  EffectSequenceComponentType2[EffectSequenceComponentType2["MovieClip"] = 1] = "MovieClip";
  EffectSequenceComponentType2[EffectSequenceComponentType2["Emitter"] = 2] = "Emitter";
  EffectSequenceComponentType2[EffectSequenceComponentType2["Trigger"] = 3] = "Trigger";
  return EffectSequenceComponentType2;
})(EffectSequenceComponentType || {});

class EffectSequence extends BaseEffect {
  constructor(componentId) {
    super(componentId);
    this._list = [];
    this._elements = new LinkedList();
    this.__on = {
      started: new FXSignal(),
      completed: new FXSignal(),
      exhausted: new FXSignal(),
      effectSpawned: new FXSignal(),
      triggerActivated: new FXSignal()
    };
  }
  // *********************************************************************************************
  // * Public																			                                        		   *
  // *********************************************************************************************
  init(container, delay = 0, autoStart = true, scaleMod = 1) {
    this.container = container;
    this._scaleMod = scaleMod;
    this._delay = delay * 1e3;
    if (autoStart)
      this.start();
    return this;
  }
  start() {
    if (this._active)
      return;
    this._startTime = Date.now() + (this.settings.delay ? this.settings.delay * 1e3 : 0) + this._delay;
    this._index = 0;
    if (this._list.length == 0) {
      this._active = false;
      if (this.__on.exhausted.__hasCallback) {
        this.__on.exhausted.dispatch(this);
      }
      if (this.__on.completed.__hasCallback) {
        this.__on.completed.dispatch(this);
      }
      this.recycle();
      return this;
    }
    this.exhausted = this.completed = false;
    this.setNextEffect();
    this.__fx.effectSequenceCount++;
    this.__fx.__addActiveEffect(this);
    if (this.__on.started.__hasCallback) {
      this.__on.started.dispatch(this);
    }
    return this;
  }
  update(dt) {
    const t = Date.now();
    if (t < this._startTime)
      return;
    this._time += dt;
    if (!this.exhausted && t >= this._effectStartTime) {
      const fx = this.__fx;
      const def = this._nextEffectSettings;
      let effect;
      let node2;
      let container;
      switch (def.componentType) {
        case EffectSequenceComponentType.Sprite:
          effect = fx.__getSprite(def.componentId);
          container = fx.__containers[def.containerId] || this.container;
          container.addChild(effect);
          effect.blendMode = fx.useBlendModes ? def.blendMode : 0;
          effect.tint = def.tint;
          effect.scale.set(Rnd.float(def.scaleMin, def.scaleMax) * Rnd.float(this.settings.scaleMin, this.settings.scaleMax) * this._scaleMod);
          effect.alpha = Rnd.float(def.alphaMin, def.alphaMax);
          effect.anchor.set(def.componentParams.anchorX, def.componentParams.anchorY);
          node2 = new Node({ component: effect, endTime: t + def.duration * 1e3 });
          this._elements.add(node2);
          effect.x = this._x;
          effect.y = this._y;
          effect.rotation = this._rotation + Rnd.float(def.rotationMin, def.rotationMax);
          if (this.__on.effectSpawned.__hasCallback) {
            this.__on.effectSpawned.dispatch(EffectSequenceComponentType.Sprite, effect);
          }
          break;
        case EffectSequenceComponentType.MovieClip:
          effect = fx.__getMovieClip(def.componentId);
          if (def.componentParams.loop) {
            effect.animationSpeed = Rnd.float(def.componentParams.animationSpeedMin || 1, def.componentParams.animationSpeedMax || 1);
            effect.loop = def.componentParams.loop || false;
          } else {
            def.duration;
          }
          effect.anchor.set(def.componentParams.anchorX, def.componentParams.anchorY);
          effect.gotoAndPlay(0);
          container = fx.__containers[def.containerId] || this.container;
          container.addChild(effect);
          effect.blendMode = fx.useBlendModes ? def.blendMode : 0;
          effect.tint = def.tint;
          effect.scale.set(Rnd.float(def.scaleMin, def.scaleMax) * Rnd.float(this.settings.scaleMin, this.settings.scaleMax) * this._scaleMod);
          effect.alpha = Rnd.float(def.alphaMin, def.alphaMax);
          node2 = new Node({ component: effect, endTime: t + def.duration * 1e3 });
          this._elements.add(node2);
          effect.x = this._x;
          effect.y = this._y;
          effect.rotation = this._rotation + Rnd.float(def.rotationMin, def.rotationMax);
          if (this.__on.effectSpawned.__hasCallback) {
            this.__on.effectSpawned.dispatch(EffectSequenceComponentType.MovieClip, effect);
          }
          break;
        case EffectSequenceComponentType.Emitter:
          effect = fx.getParticleEmitterById(def.componentId);
          container = fx.__containers[def.containerId] || this.container;
          effect.init(container, true, Rnd.float(def.scaleMin, def.scaleMax) * Rnd.float(this.settings.scaleMin, this.settings.scaleMax) * this._scaleMod);
          node2 = new Node({ component: effect, endTime: effect.endTime });
          this._elements.add(node2);
          effect.x = this._x;
          effect.y = this._y;
          effect.rotation = this._rotation + effect.settings.rotation;
          if (this.__on.effectSpawned.__hasCallback) {
            this.__on.effectSpawned.dispatch(EffectSequenceComponentType.Emitter, effect);
          }
          break;
        case EffectSequenceComponentType.Trigger:
          if (this.__on.triggerActivated.__hasCallback) {
            this.__on.triggerActivated.dispatch(def.triggerValue);
          }
          break;
      }
      if (this._index == this._list.length) {
        this.exhausted = true;
        if (this.__on.exhausted.__hasCallback) {
          this.__on.exhausted.dispatch(this);
        }
      } else {
        this.setNextEffect();
      }
    }
    const list = this._elements;
    let node = list.first;
    while (node) {
      node.update(dt);
      if (t > node.data.endTime) {
        const component = node.data.component;
        if (component instanceof ParticleEmitter) {
          if (component.completed) {
            list.remove(node);
          }
        } else {
          list.remove(node);
          component.recycle();
        }
      }
      node = node.next;
    }
    if (this.exhausted && list.length == 0) {
      this._active = false;
      this.completed = true;
      if (this.__on.completed.__hasCallback) {
        this.__on.completed.dispatch(this);
      }
      this.recycle();
    }
  }
  stop() {
    this.recycle();
  }
  recycle() {
    if (this.__recycled)
      return;
    const list = this._elements;
    let node = list.first;
    let next;
    while (node) {
      next = node.next;
      node.data.component.recycle();
      node = next;
    }
    const on = this.__on;
    if (on.completed.__hasCallback)
      on.completed.removeAll();
    if (on.started.__hasCallback)
      on.started.removeAll();
    if (on.exhausted.__hasCallback)
      on.exhausted.removeAll();
    if (on.effectSpawned.__hasCallback)
      on.effectSpawned.removeAll();
    if (on.triggerActivated.__hasCallback)
      on.triggerActivated.removeAll();
    list.clear();
    this.__recycled = true;
    this._x = this._y = this._rotation = 0;
    this.__fx.effectSequenceCount--;
    this.__fx.__recycleEffectSequence(this);
  }
  dispose() {
    this._elements.clear();
    this.__fx = void 0;
    const on = this.__on;
    on.completed = on.started = on.exhausted = on.effectSpawned = on.triggerActivated = void 0;
  }
  set rotation(value) {
    this._rotation = value;
    const list = this._elements;
    let node = list.first;
    let next;
    while (node) {
      next = node.next;
      node.data.rotation = value;
      node = next;
    }
  }
  get x() {
    return this._x;
  }
  set x(value) {
    this._x = value;
    const list = this._elements;
    let node = list.first;
    let next;
    while (node) {
      next = node.next;
      node.data.x = value;
      node = next;
    }
  }
  get y() {
    return this._y;
  }
  set y(value) {
    this._y = value;
    const list = this._elements;
    let node = list.first;
    let next;
    while (node) {
      next = node.next;
      node.data.y = value;
      node = next;
    }
  }
  get rotation() {
    return this._rotation;
  }
  get on() {
    return this.__on;
  }
  // *********************************************************************************************
  // * Private																		           *                              		   
  // *********************************************************************************************
  setNextEffect() {
    if (this.exhausted)
      return;
    const def = this._nextEffectSettings = this._list[this._index++];
    this._effectStartTime = this._startTime + def.delay * 1e3;
  }
  // *********************************************************************************************
  // * Internal																		           *                              		   
  // *********************************************************************************************
  __applySettings(value) {
    this.settings = value;
    this.name = value.name;
    this._list = value.effects.slice();
    this.__recycled = false;
  }
}

class MovieClip extends PIXI__namespace.AnimatedSprite {
  constructor(componentId, textures, anchorX, anchorY) {
    let t = [];
    let l = textures.length;
    for (let i = 0; i < l; i++) {
      t.push(PIXI__namespace.Texture.from(textures[i]));
    }
    super(t);
    this.componentId = componentId;
    this.anchor.set(0.5, 0.5);
    this.loop = false;
    this.__sequenceEndTime = 0;
  }
  // *********************************************************************************************
  // * Public																		                                        			   *
  // *********************************************************************************************
  recycle() {
    this.alpha = 1;
    this.tint = 16777215;
    this.rotation = 0;
    this.scale.set(1);
    if (this.parent)
      this.parent.removeChild(this);
    this.gotoAndStop(0);
    this.__fx.__recycleMovieClip(this.componentId, this);
  }
  dispose() {
    if (this.parent)
      this.parent.removeChild(this);
    this.gotoAndStop(0);
    this.destroy();
  }
  // *********************************************************************************************
  // * Private																				   *
  // *********************************************************************************************
  // *********************************************************************************************
  // * Events																		               *
  // *********************************************************************************************
}

class Color {
  constructor() {
  }
  // *********************************************************************************************
  // * Public									                                        												   *
  // *********************************************************************************************
  setRgb(startRgb, targetRgb) {
    this.startRgb = this.rgb = startRgb;
    this.r = this.sR = startRgb >> 16 & 255;
    this.g = this.sG = startRgb >> 8 & 255;
    this.b = this.sB = startRgb & 255;
    this.targetRgb = targetRgb;
    this.dR = (targetRgb >> 16 & 255) - this.r;
    this.dG = (targetRgb >> 8 & 255) - this.g;
    this.dB = (targetRgb & 255) - this.b;
  }
  tween(ease, time, duration) {
    if (ease) {
      this.r = ease(time, this.sR, this.dR, duration);
      this.g = ease(time, this.sG, this.dG, duration);
      this.b = ease(time, this.sB, this.dB, duration);
    } else {
      time /= duration;
      this.r = this.dR * time + this.sR;
      this.g = this.dG * time + this.sG;
      this.b = this.dB * time + this.sB;
    }
    this.rgb = this.r << 16 | this.g << 8 | this.b;
    return this.rgb;
  }
  // *********************************************************************************************
  // * Private					                                        															   *
  // *********************************************************************************************
  // *********************************************************************************************
  // * Events										                                        											   *
  // *********************************************************************************************
}

class Easing {
  static linear(t, b, c, d) {
    return c * t / d + b;
  }
  static easeInQuad(t, b, c, d) {
    return c * (t /= d) * t + b;
  }
  static easeOutQuad(t, b, c, d) {
    return -c * (t /= d) * (t - 2) + b;
  }
  static easeInOutQuad(t, b, c, d) {
    if ((t /= d / 2) < 1) {
      return c / 2 * t * t + b;
    } else {
      return -c / 2 * (--t * (t - 2) - 1) + b;
    }
  }
  static easeInCubic(t, b, c, d) {
    return c * (t /= d) * t * t + b;
  }
  static easeOutCubic(t, b, c, d) {
    return c * ((t = t / d - 1) * t * t + 1) + b;
  }
  static easeInOutCubic(t, b, c, d) {
    if ((t /= d / 2) < 1) {
      return c / 2 * t * t * t + b;
    } else {
      return c / 2 * ((t -= 2) * t * t + 2) + b;
    }
  }
  static easeInQuart(t, b, c, d) {
    return c * (t /= d) * t * t * t + b;
  }
  static easeOutQuart(t, b, c, d) {
    return -c * ((t = t / d - 1) * t * t * t - 1) + b;
  }
  static easeInOutQuart(t, b, c, d) {
    if ((t /= d / 2) < 1) {
      return c / 2 * t * t * t * t + b;
    } else {
      return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
    }
  }
  static easeInQuint(t, b, c, d) {
    return c * (t /= d) * t * t * t * t + b;
  }
  static easeOutQuint(t, b, c, d) {
    return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
  }
  static easeInOutQuint(t, b, c, d) {
    if ((t /= d / 2) < 1) {
      return c / 2 * t * t * t * t * t + b;
    } else {
      return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
    }
  }
  static easeInSine(t, b, c, d) {
    return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
  }
  static easeOutSine(t, b, c, d) {
    return c * Math.sin(t / d * (Math.PI / 2)) + b;
  }
  static easeInOutSine(t, b, c, d) {
    return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
  }
  static easeInExpo(t, b, c, d) {
    if (t === 0) {
      return b;
    } else {
      return c * Math.pow(2, 10 * (t / d - 1)) + b;
    }
  }
  static easeOutExpo(t, b, c, d) {
    if (t === d) {
      return b + c;
    } else {
      return c * (-Math.pow(2, -10 * t / d) + 1) + b;
    }
  }
  static easeInOutExpo(t, b, c, d) {
    if ((t /= d / 2) < 1) {
      return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
    } else {
      return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
    }
  }
  static easeInCirc(t, b, c, d) {
    return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
  }
  static easeOutCirc(t, b, c, d) {
    return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
  }
  static easeInOutCirc(t, b, c, d) {
    if ((t /= d / 2) < 1) {
      return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
    } else {
      return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
    }
  }
  static easeInElastic(t, b, c, d) {
    let a, p, s;
    s = 1.70158;
    p = 0;
    a = c;
    if (t === 0) ; else if ((t /= d) === 1) ;
    if (!p) {
      p = d * 0.3;
    }
    if (a < Math.abs(c)) {
      a = c;
      s = p / 4;
    } else {
      s = p / (2 * Math.PI) * Math.asin(c / a);
    }
    return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
  }
  static easeOutElastic(t, b, c, d) {
    let a, p, s;
    s = 1.70158;
    p = 0;
    a = c;
    if (t === 0) ; else if ((t /= d) === 1) ;
    if (!p) {
      p = d * 0.3;
    }
    if (a < Math.abs(c)) {
      a = c;
      s = p / 4;
    } else {
      s = p / (2 * Math.PI) * Math.asin(c / a);
    }
    return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
  }
  static easeInOutElastic(t, b, c, d) {
    let a, p, s;
    s = 1.70158;
    p = 0;
    a = c;
    if (t === 0) ; else if ((t /= d / 2) === 2) ;
    if (!p) {
      p = d * (0.3 * 1.5);
    }
    if (a < Math.abs(c)) {
      a = c;
      s = p / 4;
    } else {
      s = p / (2 * Math.PI) * Math.asin(c / a);
    }
    if (t < 1) {
      return -0.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
    } else {
      return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * 0.5 + c + b;
    }
  }
  static easeInBack(t, b, c, d, s) {
    if (s === void 0) {
      s = 1.70158;
    }
    return c * (t /= d) * t * ((s + 1) * t - s) + b;
  }
  static easeOutBack(t, b, c, d, s) {
    if (s === void 0) {
      s = 1.70158;
    }
    return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
  }
  static easeInOutBack(t, b, c, d, s) {
    if (s === void 0) {
      s = 1.70158;
    }
    if ((t /= d / 2) < 1) {
      return c / 2 * (t * t * (((s *= 1.525) + 1) * t - s)) + b;
    } else {
      return c / 2 * ((t -= 2) * t * (((s *= 1.525) + 1) * t + s) + 2) + b;
    }
  }
  static easeInBounce(t, b, c, d) {
    let v;
    v = Easing.easeOutBounce(d - t, 0, c, d);
    return c - v + b;
  }
  static easeOutBounce(t, b, c, d) {
    if ((t /= d) < 1 / 2.75) {
      return c * (7.5625 * t * t) + b;
    } else if (t < 2 / 2.75) {
      return c * (7.5625 * (t -= 1.5 / 2.75) * t + 0.75) + b;
    } else if (t < 2.5 / 2.75) {
      return c * (7.5625 * (t -= 2.25 / 2.75) * t + 0.9375) + b;
    } else {
      return c * (7.5625 * (t -= 2.625 / 2.75) * t + 0.984375) + b;
    }
  }
  static easeInOutBounce(t, b, c, d) {
    let v;
    if (t < d / 2) {
      v = Easing.easeInBounce(t * 2, 0, c, d);
      return v * 0.5 + b;
    } else {
      v = Easing.easeOutBounce(t * 2 - d, 0, c, d);
      return v * 0.5 + c * 0.5 + b;
    }
  }
}

class Particle extends Node {
  constructor() {
    super();
    this.dx = 0;
    this.dy = 0;
    this._childEmitters = [];
    this._hasChildEmitters = false;
    this._spawnOnHalfway = false;
    this.__recycled = true;
    this.__on = {
      died: new FXSignal(),
      bounced: new FXSignal(),
      updated: new FXSignal()
    };
    this._color = new Color();
  }
  // *********************************************************************************************
  // * Public																	                                        				   *
  // *********************************************************************************************
  init(emitter, settings, scaleMod) {
    const component = this.component;
    const fx = this.__fx;
    this.emitter = emitter;
    this.settings = settings;
    const duration = this.duration = Rnd.float(settings.durationMin, settings.durationMax) * scaleMod;
    this._dt = 1 / this.duration;
    this.time = 0;
    this.__recycled = false;
    settings.addOnTop ? emitter.container.addChild(component) : emitter.container.addChildAt(component, 0);
    component.blendMode = fx.useBlendModes ? settings.blendMode : 0;
    this.startX = component.x;
    this.startY = component.y;
    this.useGravity = emitter.settings.useGravity;
    this.useScale = settings.useScale;
    this.useRotation = settings.useRotation;
    this.useAlpha = settings.useAlpha;
    this.useTint = settings.useTint;
    this.useSpawns = settings.useSpawns;
    this.useChilds = settings.useChilds;
    this.useMotion = settings.useMotion;
    if (this.useGravity) {
      this.gravity = emitter.settings.gravity;
      this.useFloor = emitter.settings.useFloor;
      this.floorY = emitter.settings.floorY;
      this.bounceFac = Rnd.float(settings.bounceFacMin, settings.bounceFacMax) * scaleMod;
      this.friction = 1 - Rnd.float(settings.frictionMin, settings.frictionMax) * scaleMod;
      this._spawnOnBounce = settings.spawn.onBounce.length > 0;
      this.useAlign = settings.align;
      if (settings.useMotion) {
        const speed = Rnd.float(settings.moveSpeedMin, settings.moveSpeedMax);
        this.moveSpeedX = speed * this.dx * scaleMod;
        this.moveSpeedY = speed * this.dy * scaleMod;
      } else {
        this.moveSpeedX = this.moveSpeedY = 0;
      }
    } else {
      if (settings.useMotion) {
        const d = this.distance = Rnd.integer(settings.distanceMin, settings.distanceMax) * 0.8 * scaleMod;
        this.deltaX = (component.x + d * this.dx - this.startX) * 0.8;
        this.deltaY = (component.y + d * this.dy - this.startY) * 0.8;
        this.distanceEase = Easing[settings.distanceEase];
        this.useAlign = false;
      } else {
        component.x = this.startX;
        component.y = this.startY;
      }
    }
    if (settings.useRotation && settings.randomStartRotation && !this.useAlign) {
      component.rotation = Rnd.float(0, 6.28319);
    }
    if (settings.useAlpha) {
      this.alphaStart = component.alpha = Rnd.float(settings.alphaStartMin, settings.alphaStartMax);
      this.alphaDelta = Rnd.float(settings.alphaEndMin, settings.alphaEndMax) - this.alphaStart;
      this.alphaEase = Easing[settings.alphaEase] || null;
      this.useFadeIn = settings.fadeIn;
      if (settings.fadeIn) {
        this.alphaDuration = duration * (1 - settings.fadeInDurationFac);
        this.fadeInDuration = duration * settings.fadeInDurationFac;
        this.fadeInEase = Easing[settings.fadeInEase || "easeInSine"];
      }
    }
    if (settings.useScale) {
      this.uniformScale = settings.uniformScale;
      this.useScaleIn = settings.scaleIn;
      if (settings.useScale) {
        this.uniformScale = settings.uniformScale;
        this.scaleEase = Easing[settings.scaleEase];
        if (settings.uniformScale) {
          this.scaleStart = component.scale.x = component.scale.y = Rnd.float(settings.scaleStartMin, settings.scaleStartMax) * scaleMod;
          this.scaleDelta = (Rnd.float(settings.scaleEndMin, settings.scaleEndMax) - this.scaleStart) * scaleMod;
        } else {
          this.scaleXStart = component.scale.x = Rnd.float(settings.scaleXStartMin, settings.scaleXStartMax) * scaleMod;
          this.scaleXDelta = (Rnd.float(settings.scaleXEndMin, settings.scaleXEndMax) - this.scaleXStart) * scaleMod;
          this.scaleXEase = Easing[settings.scaleXEase];
          this.scaleYStart = component.scale.y = Rnd.float(settings.scaleYStartMin, settings.scaleYStartMax) * scaleMod;
          this.scaleYDelta = (Rnd.float(settings.scaleYEndMin, settings.scaleYEndMax) - this.scaleYStart) * scaleMod;
          this.scaleYEase = Easing[settings.scaleYEase];
        }
        if (settings.scaleIn) {
          this.scaleDuration = duration * (1 - settings.scaleInDurationFac);
          this.scaleInDuration = duration * settings.scaleInDurationFac;
          this.scaleInEase = Easing[settings.scaleInEase || "easeInSine"];
        }
      } else {
        if (settings.uniformScale) {
          component.scale.x = settings.scaleStartMin;
          component.scale.y = settings.scaleStartMin;
        } else {
          component.scale.x = settings.scaleXStartMin;
          component.scale.y = settings.scaleYStartMin;
        }
      }
    }
    if (settings.useRotation) {
      this.rotationSpeed = Rnd.float(settings.rotationSpeedMin, settings.rotationSpeedMax) * scaleMod;
      if (settings.randomRotationDirection)
        this.rotationSpeed *= Rnd.sign();
    }
    if (settings.useTint) {
      this.tintEase = Easing[settings.tintEase];
      this._color.setRgb(settings.tintStart, settings.tintEnd);
    }
    if (settings.useChilds) {
      this._childEmitters.length = 0;
      let l = settings.childs.length;
      this._hasChildEmitters = l > 0;
      if (this._childEmitters) {
        while (--l > -1) {
          const def = settings.childs[l];
          const em = fx.getParticleEmitterById(def.id);
          em.init(emitter.container, true, (def.scale || 1) * (scaleMod || 1));
          if (def.adoptRotation) {
            em.rotation = component.rotation;
            em.__adoptRotation = true;
          }
          em.__parent = this;
          this._childEmitters.push(em);
        }
      }
    }
    if (settings.useSpawns) {
      if (settings.spawn.onStart.length > 0) {
        emitter.__subSpawn(this, settings.spawn.onStart);
      }
      this._spawnOnHalfway = settings.spawn.onHalfway.length > 0;
    }
    if (emitter.__on.particleSpawned.__hasCallback) {
      emitter.__on.particleSpawned.dispatch(this);
    }
    return this;
  }
  update(dt) {
    const t = this.time += dt;
    const duration = this.duration;
    if (t >= duration) {
      this.emitter.__removeParticle(this);
      return;
    }
    const component = this.component;
    const mod = t * dt;
    if (this.useGravity) {
      const dt2 = dt / 0.0166666;
      component.x += this.moveSpeedX * dt2;
      component.y += this.moveSpeedY * dt2;
      this.moveSpeedY += this.gravity * dt2;
      if (this.useAlign) {
        component.rotation = Math.atan2(this.moveSpeedY, this.moveSpeedX);
      }
      if (this.useFloor && this.floorY > 0) {
        if (component.y > this.floorY) {
          component.y = this.floorY;
          this.moveSpeedY *= -this.bounceFac;
          this.moveSpeedX *= this.friction;
          if (this.useSpawns && this._spawnOnBounce) {
            this.emitter.__subSpawn(this, this.settings.spawn.onBounce);
          }
          const emitter = this.emitter;
          if (emitter.__on.particleBounced.__hasCallback) {
            emitter.__on.particleBounced.dispatch(this);
          }
          if (this.__on.bounced.__hasCallback) {
            this.__on.bounced.dispatch(this);
          }
          if (this.settings.stopOnBounce) {
            emitter.__removeParticle(this);
          }
          return;
        }
      }
    } else if (this.useMotion) {
      if (this.distanceEase) {
        component.x = this.distanceEase(t, this.startX, this.deltaX, duration);
        component.y = this.distanceEase(t, this.startY, this.deltaY, duration);
      } else {
        component.x = this.deltaX * mod + this.startX;
        component.y = this.deltaY * mod + this.startY;
      }
    }
    if (this.useAlpha) {
      if (this.useFadeIn) {
        if (t < this.fadeInDuration) {
          component.alpha = this.fadeInEase(t, 0, this.alphaStart, this.fadeInDuration);
        } else {
          component.alpha = this.alphaEase(t - this.fadeInDuration, this.alphaStart, this.alphaDelta, this.alphaDuration);
        }
      } else {
        if (this.alphaEase) {
          component.alpha = this.alphaEase(t, this.alphaStart, this.alphaDelta, duration);
        } else {
          component.alpha = this.alphaDelta * mod + this.alphaStart;
        }
      }
    }
    if (this.useRotation) {
      component.rotation += this.rotationSpeed;
    }
    if (this.useScale) {
      if (this.uniformScale) {
        if (this.useScaleIn) {
          if (t < this.scaleInDuration) {
            component.scale.x = component.scale.y = this.scaleInEase(t, 0, this.scaleStart, this.scaleInDuration);
          } else {
            component.scale.x = component.scale.y = this.scaleEase(t - this.scaleInDuration, this.scaleStart, this.scaleDelta, this.scaleDuration);
          }
        } else {
          if (this.scaleEase) {
            component.scale.x = this.scaleEase(t, this.scaleStart, this.scaleDelta, duration);
            component.scale.y = this.scaleEase(t, this.scaleStart, this.scaleDelta, duration);
          } else {
            component.scale.x = component.scale.y = this.scaleDelta * mod + this.scaleStart;
          }
        }
      } else {
        if (this.useScaleIn) {
          if (t < this.scaleInDuration) {
            component.scale.x = this.scaleInEase(t, 0, this.scaleXStart, this.scaleInDuration);
            component.scale.y = this.scaleInEase(t, 0, this.scaleYStart, this.scaleInDuration);
          } else {
            component.scale.x = this.scaleEase(t - this.scaleInDuration, this.scaleXStart, this.scaleXDelta, this.scaleDuration);
            component.scale.y = this.scaleEase(t - this.scaleInDuration, this.scaleYStart, this.scaleYDelta, this.scaleDuration);
          }
        } else {
          if (this.scaleXEase) {
            component.scale.x = this.scaleXEase(t, this.scaleXStart, this.scaleXDelta, duration);
          } else {
            component.scale.x = this.scaleXDelta * mod + this.scaleXStart;
          }
          if (this.scaleYEase) {
            component.scale.y = this.scaleYEase(t, this.scaleYStart, this.scaleYDelta, duration);
          } else {
            component.scale.y = this.scaleYDelta * mod + this.scaleYStart;
          }
        }
      }
    }
    if (this.useTint) {
      component.tint = this._color.tween(this.tintEase, t, duration);
    }
    if (this._spawnOnHalfway) {
      if (t >= 0.5) {
        this._spawnOnHalfway = false;
        this.emitter.__subSpawn(this, this.settings.spawn.onHalfway);
      }
    }
    if (this.useChilds && this._hasChildEmitters) {
      const childs = this._childEmitters;
      let l = childs.length;
      while (--l > -1) {
        const child = childs[l];
        if (child.__recycled)
          continue;
        child.x = component.position.x;
        child.y = component.position.y;
        if (child.__adoptRotation) {
          child.rotation = component.rotation;
        }
      }
    }
    if (this.emitter.__on.particleUpdated.__hasCallback) {
      this.emitter.__on.particleUpdated.dispatch(this);
    }
    if (this.__on.updated.__hasCallback) {
      this.__on.updated.dispatch(this);
    }
  }
  stop() {
    this.time = this.duration;
  }
  recycle() {
    if (this.emitter.__on.particleDied.__hasCallback) {
      this.emitter.__on.particleDied.dispatch(this);
    }
    const on = this.__on;
    if (on.died.__hasCallback) {
      on.died.dispatch(this);
      on.died.removeAll();
    }
    if (on.updated.__hasCallback) {
      on.updated.removeAll();
    }
    if (on.bounced.__hasCallback) {
      on.bounced.removeAll();
    }
    if (this._hasChildEmitters) {
      const childs = this._childEmitters;
      let l = childs.length;
      while (--l > -1) {
        childs[l].stop(true);
      }
      this._childEmitters.length = 0;
      this._hasChildEmitters = false;
    }
    this.component.recycle();
    this.__fx.__recycleParticle(this);
    this.dx = this.dy = this.deltaX = this.deltaY = 0;
    this.component = null;
    this.emitter = null;
    this.settings = null;
    this.__recycled = true;
  }
  dispose() {
    this.recycle();
    this.__fx = null;
  }
  get x() {
    return this.component.x;
  }
  get y() {
    return this.component.y;
  }
  get on() {
    return this.__on;
  }
  // *********************************************************************************************
  // * Internal																                                        				   *
  // *********************************************************************************************
  __removeChildEmitter(emitter) {
    const index = this._childEmitters.indexOf(emitter);
    if (index > -1) {
      this._childEmitters.splice(index, 1);
      if (this._childEmitters.length == 0)
        this._hasChildEmitters = false;
    }
  }
}

class Sanitizer {
  static sanitizeBundle(bundle) {
    for (let emitter of bundle.emitters) {
      const structure = Sanitizer._presetStructure.emitter;
      Sanitizer.parse(emitter, structure, Sanitizer._presetStructure.emitterSpawn);
    }
    for (let sequence of bundle.sequences) {
      const structure = Sanitizer._presetStructure.sequence;
      Sanitizer.parse(sequence, structure, Sanitizer._presetStructure.sequenceEffect);
    }
  }
  static parse(bundleObject, structureObject, spawnStructureObject) {
    for (let propName in structureObject) {
      if (bundleObject[propName] == null) {
        bundleObject[propName] = structureObject[propName];
      } else {
        const bundleProp = bundleObject[propName];
        if (typeof bundleProp !== "object")
          continue;
        const structureProp = structureObject[propName];
        if (!bundleProp.hasOwnProperty("length")) {
          Sanitizer.parse(bundleProp, structureProp, spawnStructureObject);
        } else {
          for (let spawn of bundleProp) {
            for (let spawnPropName in spawnStructureObject) {
              if (spawn[spawnPropName] == null) {
                spawn[spawnPropName] = spawnStructureObject[spawnPropName];
              }
            }
          }
        }
      }
    }
  }
  static {
    this._presetStructure = {
      sequence: {
        id: 0,
        name: "",
        type: 1,
        delay: 0,
        scaleMin: 1,
        scaleMax: 1,
        effects: []
      },
      sequenceEffect: {
        id: 0,
        componentId: null,
        componentType: 0,
        delay: 0,
        componentParams: {
          animationSpeedMin: 1,
          animationSpeedMax: 1,
          anchorX: 0.5,
          anchorY: 0.5,
          loop: false
        },
        scaleMin: 1,
        scaleMax: 1,
        alphaMin: 1,
        alphaMax: 1,
        rotationMin: 0,
        rotationMax: 0,
        blendMode: 0,
        duration: 0.1,
        tint: 16777215,
        containerId: "",
        triggerValue: ""
      },
      emitter: {
        id: 0,
        name: "",
        type: 0,
        core: {
          type: "circle",
          params: {
            radius: 100,
            radial: true,
            angle: 6.28318530718,
            uniform: false,
            width: 100,
            height: 100
          }
        },
        spawnFrequencyMin: 0.1,
        spawnFrequencyMax: 0.1,
        maxParticles: 1e3,
        spawnCountMin: 1,
        spawnCountMax: 1,
        duration: 0,
        infinite: true,
        useGravity: false,
        gravity: 0,
        useFloor: false,
        floorY: 700,
        rotation: 0,
        autoRotation: 0,
        particleSettings: {
          componentType: 0,
          componentId: "",
          componentParams: {
            animationSpeedMin: 1,
            animationSpeedMax: 1,
            anchorX: 0.5,
            anchorY: 0.5,
            loop: false
          },
          durationMin: 1,
          durationMax: 2,
          distanceMin: 0,
          distanceMax: 0,
          distanceEase: "linear",
          moveSpeedMin: 0,
          moveSpeedMax: 0,
          bounceFacMin: 0,
          bounceFacMax: 0,
          frictionMin: 0,
          frictionMax: 0,
          useMotion: false,
          useRotation: false,
          useAlpha: false,
          useScale: false,
          useTint: false,
          useChilds: false,
          useSpawns: false,
          stopOnBounce: false,
          align: false,
          blendMode: 1,
          addOnTop: true,
          rotationSpeedMin: 0,
          rotationSpeedMax: 0,
          randomRotationDirection: false,
          randomStartRotation: false,
          fadeIn: true,
          fadeInDurationFac: 0.1,
          fadeInEase: "linear",
          alphaStartMin: 0.7,
          alphaStartMax: 0.9,
          alphaEndMin: 0.7,
          alphaEndMax: 0.8,
          alphaEase: "linear",
          tintStart: 16777215,
          tintEnd: 16777215,
          tintEase: "linear",
          scaleIn: false,
          scaleInDurationFac: 0.2,
          scaleInEase: "linear",
          uniformScale: true,
          scaleXStartMin: 1,
          scaleXStartMax: 1,
          scaleXEndMin: 1,
          scaleXEndMax: 1,
          scaleXEase: "linear",
          scaleYStartMin: 1,
          scaleYStartMax: 1,
          scaleYEndMin: 1,
          scaleYEndMax: 1,
          scaleYEase: "linear",
          scaleStartMin: 1,
          scaleStartMax: 1,
          scaleEndMin: 1,
          scaleEndMax: 1,
          scaleEase: "linear",
          childs: [],
          spawn: {
            onComplete: [],
            onBounce: [],
            onHalfway: [],
            onStart: []
          }
        },
        childs: []
      },
      emitterSpawn: {
        type: 0,
        id: 0,
        scale: 1,
        adoptRotation: true,
        containerId: ""
      }
    };
  }
}

class Sprite extends PIXI__namespace.Sprite {
  constructor(componentId, texture, anchorX, anchorY) {
    super(PIXI__namespace.Texture.from(texture));
    this.componentId = componentId;
    this.anchor.set(anchorX || 0.5, anchorY || 0.5);
    this.__sequenceEndTime = null;
  }
  // *********************************************************************************************
  // * Public										                                        											   *
  // *********************************************************************************************
  recycle() {
    this.tint = 16777215;
    this.alpha = 1;
    this.rotation = 0;
    this.scale.set(1);
    if (this.parent)
      this.parent.removeChild(this);
    this.__fx.__recycleSprite(this.componentId, this);
  }
  dispose() {
    this.__fx = null;
    this.recycle();
    this.destroy(false);
  }
  // *********************************************************************************************
  // * Private																		                                        		   *
  // *********************************************************************************************
  // *********************************************************************************************
  // * Events			                                        																		   *
  // *********************************************************************************************
}

class BaseEmitterCore {
  constructor(type) {
    this.type = type;
    this._dx = 0;
    this._dy = 0;
    this._rotation = 0;
  }
  static {
    this.__TYPE_BOX = "box";
  }
  static {
    this.__TYPE_CIRCLE = "circle";
  }
  static {
    this.__TYPE_RING = "ring";
  }
  // *********************************************************************************************
  // * Public			                                        								   *
  // *********************************************************************************************
  init(emitter) {
    this.emitter = emitter;
    this._settings = emitter.settings.core.params;
    this.x = this.__x = emitter.x;
    this.y = this.__y = emitter.y;
    this.rotation = emitter.rotation;
  }
  emit(particle) {
  }
  prepare(spawnCount) {
    this._posInterpolationStep = 1 / spawnCount;
    this._t = this._posInterpolationStep * 0.5;
  }
  step() {
    this.__x = this.x;
    this.__y = this.y;
  }
  recycle() {
    this.emitter = null;
    this._settings = null;
  }
  dispose() {
    this.recycle();
    this.emitter = null;
    this._settings = null;
  }
  get rotation() {
    return this._rotation;
  }
  set rotation(value) {
    this._rotation = value;
    this._dx = Math.cos(value);
    this._dy = Math.sin(value);
  }
  // *********************************************************************************************
  // * Private								                                        												   *
  // *********************************************************************************************
  // *********************************************************************************************
  // * Events								                                        													   *
  // *********************************************************************************************
}

class BoxEmitterCore extends BaseEmitterCore {
  constructor() {
    super(BaseEmitterCore.__TYPE_BOX);
  }
  // *********************************************************************************************
  // * Public																					   *
  // *********************************************************************************************
  emit(particle) {
    const settings = this._settings;
    const emitter = this.emitter;
    const w2 = settings.width * 0.5 * this.__scaleMod;
    const h2 = settings.height * 0.5 * this.__scaleMod;
    let angle = emitter.rotation;
    const x = Rnd.float(-w2, w2);
    const y = Rnd.float(-h2, h2);
    if (angle != 0) {
      particle.component.x = this.__x + this._t * (this.x - this.__x) + x * Math.cos(angle) - y * Math.sin(angle);
      particle.component.y = this.__y + this._t * (this.y - this.__y) + x * Math.sin(angle) + y * Math.cos(angle);
    } else {
      particle.component.x = this.__x + this._t * (this.x - this.__x) + x;
      particle.component.y = this.__y + this._t * (this.y - this.__y) + y;
    }
    if (settings.radial) {
      angle += Math.atan2(y, x);
      particle.dx = Math.cos(angle);
      particle.dy = Math.sin(angle);
    } else {
      particle.dx = this._dx;
      particle.dy = this._dy;
    }
    particle.component.rotation = angle;
    this._t += this._posInterpolationStep;
  }
  // *********************************************************************************************
  // * Private																		                                        		   *
  // *********************************************************************************************
  // *********************************************************************************************
  // * Events																                                        					   *
  // *********************************************************************************************
}

class CircleEmitterCore extends BaseEmitterCore {
  constructor() {
    super(BaseEmitterCore.__TYPE_CIRCLE);
  }
  // *********************************************************************************************
  // * Public																	                   *
  // *********************************************************************************************
  emit(particle) {
    const settings = this._settings;
    const emitter = this.emitter;
    let angle;
    if (!settings.angle) {
      angle = Rnd.float(0, 6.28319) + emitter.rotation;
    } else {
      angle = Rnd.float(-settings.angle * 0.5, settings.angle * 0.5) + emitter.rotation;
    }
    if (settings.radius > 0) {
      let r = Rnd.float(0, settings.radius) * this.__scaleMod;
      particle.component.x = this.__x + this._t * (this.x - this.__x) + Math.cos(angle) * r;
      particle.component.y = this.__y + this._t * (this.y - this.__y) + Math.sin(angle) * r;
    } else {
      particle.component.x = this.__x + this._t * (this.x - this.__x);
      particle.component.y = this.__y + this._t * (this.y - this.__y);
    }
    if (settings.radial) {
      particle.dx = Math.cos(angle);
      particle.dy = Math.sin(angle);
      particle.component.rotation = angle;
    } else {
      particle.dx = this._dx;
      particle.dy = this._dy;
      particle.component.rotation = emitter.rotation;
    }
    this._t += this._posInterpolationStep;
  }
  // *********************************************************************************************
  // * Private									                                        	   *
  // *********************************************************************************************
  // *********************************************************************************************
  // * Events							                                        				   *
  // *********************************************************************************************
}

class RingEmitterCore extends BaseEmitterCore {
  constructor() {
    super(BaseEmitterCore.__TYPE_RING);
  }
  // *********************************************************************************************
  // * Public																		               *
  // *********************************************************************************************
  prepare(spawnCount) {
    super.prepare(spawnCount);
    const angle = this._settings.angle;
    if (2 * Math.PI - angle < 0.1) {
      this._uniformStep = angle / spawnCount;
      this._angle = angle;
    } else {
      this._uniformStep = angle / (spawnCount - 1);
      this._angle = -angle * 0.5;
    }
  }
  emit(particle) {
    const settings = this._settings;
    const emitter = this.emitter;
    let angle;
    if (settings.uniform) {
      angle = this._angle + emitter.rotation;
      this._angle += this._uniformStep;
    } else {
      angle = Rnd.float(-settings.angle * 0.5, settings.angle * 0.5) + emitter.rotation;
    }
    const r = settings.radius * this.__scaleMod;
    particle.component.x = this.__x + this._t * (this.x - this.__x) + Math.cos(angle) * r;
    particle.component.y = this.__y + this._t * (this.y - this.__y) + Math.sin(angle) * r;
    if (settings.radial) {
      particle.dx = Math.cos(angle);
      particle.dy = Math.sin(angle);
      particle.component.rotation = angle;
    } else {
      particle.dx = this._dx;
      particle.dy = this._dy;
      particle.component.rotation = emitter.rotation;
    }
    this._t += this._posInterpolationStep;
  }
  // *********************************************************************************************
  // * Private																	               *
  // *********************************************************************************************
  // *********************************************************************************************
  // * Events															                           *
  // *********************************************************************************************
}

class FX {
  constructor() {
    this.useBlendModes = true;
    this.particleCount = 0;
    this.emitterCount = 0;
    this.effectSequenceCount = 0;
    this.maxParticles = 5e3;
    this.particleFac = 1;
    this._active = false;
    this._effects = new LinkedList();
    this.__containers = {};
    this.clearCache();
    this.start();
  }
  static {
    this.settingsVersion = 0;
  }
  static {
    this.version = "1.3.3";
  }
  static {
    this._bundleHash = "80c6df7fb0d3d898f34ce0031c037fef";
  }
  static {
    this.ComponentType = ComponentType;
  }
  static {
    this.EffectSequenceComponentType = EffectSequenceComponentType;
  }
  static {
    this.__emitterCores = {
      circle: CircleEmitterCore,
      box: BoxEmitterCore,
      ring: RingEmitterCore
    };
  }
  // *********************************************************************************************
  // * Public										                                        	   *
  // *********************************************************************************************
  /**
   * Starts the process.
   *
   * @param {} - No parameters.
   * @return {} - No return value.
   */
  start() {
    this._active = true;
    this._timeElapsed = Date.now();
  }
  /**
   * Pauses the execution of the function.
   *
   * @param {} 
   * @return {} 
   */
  pause() {
    this._active = false;
  }
  /**
   * Updates the state of the object based on the elapsed time.
   *
   * @param {number} delta - The time delta to update by. Default is 1.
   */
  update(delta = 1) {
    if (!this.active)
      return;
    const t = Date.now();
    let dt = (t - this._timeElapsed) * 1e-3;
    dt *= delta;
    const list = this._effects;
    let node = list.first;
    let next;
    while (node) {
      next = node.next;
      node.update(dt);
      node = next;
    }
    this._timeElapsed = t;
  }
  /**
   * Clears the cache by resetting all cache objects to empty values.
   *
   * @param {} 
   * @return {} 
   */
  clearCache() {
    this._cache = {
      particles: [],
      mcs: [],
      sprites: [],
      effectSequences: [],
      emitters: [],
      cores: {}
    };
    this._settingsCache = {
      mcs: {},
      sprites: {},
      emitters: {},
      effectSequences: {}
    };
    this._nameMaps = {
      emitters: {},
      effectSequences: {}
    };
  }
  /**
   * Sets the value of the floorY property for all emitters in the settings cache.
   *
   * @param {number} value - The new value for the floorY property.
   */
  setFloorY(value) {
    const s = this._settingsCache.emitters;
    for (let n in s) {
      s[n].floorY = value;
    }
  }
  /**
   * Disposes of all the effects in the list and clears the cache.
   */
  dispose() {
    let list = this._effects;
    let node = list.first;
    while (node) {
      node.dispose();
      node = node.next;
    }
    list.clear();
    this.clearCache();
  }
  /**
   * Loads the bundle files and returns a promise that resolves to the parsed sprite sheet result.
   *
   * @param {string} bundleSettingsUrl - The URL of the bundle settings.
   * @param {string} spritesheetUrl - The URL of the sprite sheet.
   * @param {string} spritesheetFilter - The filter for the sprite sheet. Default is an empty string.
   * @param {string[]} additionalAssets - An array of additional asset URLs. Default is an empty array.
   * @return {Promise<IParseSpriteSheetResult>} A promise that resolves to the parsed sprite sheet result.
   */
  loadBundleFiles(bundleSettingsUrl, spritesheetUrl, spritesheetFilter = "", additionalAssets = []) {
    return new Promise(async (resolve, reject) => {
      const data = {
        "rfx_spritesheet": spritesheetUrl,
        "rfx_bundleSettings": bundleSettingsUrl
      };
      for (var i in additionalAssets) {
        data[i] = additionalAssets[i];
      }
      PIXI__namespace.Assets.addBundle("rfx_assets", data);
      const assets = await PIXI__namespace.Assets.loadBundle("rfx_assets");
      resolve(this.initBundle(assets.rfx_bundleSettings));
    });
  }
  /**
   * Initializes the bundle with the given settings and optionally clears the cache.
   *
   * @param {any} bundleSettings - The settings for the bundle.
   * @param {boolean} clearCache - Whether to clear the cache or not. Optional, default is false.
   * @returns {IParseSpriteSheetResult} The result of parsing the sprite sheet.
   */
  initBundle(bundleSettings, clearCache) {
    if (bundleSettings.__h !== FX._bundleHash) {
      throw new Error("Invalid settings file.");
    }
    if (bundleSettings.__v != FX.settingsVersion) {
      throw new Error("Settings version mismatch.");
    }
    Sanitizer.sanitizeBundle(bundleSettings);
    if (clearCache) {
      this.clearCache();
    }
    for (let n in bundleSettings.emitters) {
      const preset = bundleSettings.emitters[n];
      this.addParticleEmitter(preset.id, preset);
    }
    for (let n in bundleSettings.sequences) {
      const preset = bundleSettings.sequences[n];
      this.addEffectSequence(preset.id, preset);
    }
    this.useBlendModes = bundleSettings.useBlendModes;
    this.maxParticles = bundleSettings.maxParticles;
    return this.parseTextureCache(bundleSettings.spritesheetFilter);
  }
  /**
   * Adds a particle emitter to the FX object.
   *
   * @param {string} componentId - The unique identifier for the emitter component.
   * @param {IEmitterSettings} settings - The settings for the emitter.
   * @throws {Error} Throws an error if the componentId already exists.
   * @return {FX} Returns the FX object for chaining.
   */
  addParticleEmitter(componentId, settings) {
    if (this._settingsCache.emitters[componentId])
      throw new Error(`ComponentId '${componentId}' already exists.`);
    this._settingsCache.emitters[componentId] = settings;
    this._nameMaps.emitters[settings.name] = settings;
    return this;
  }
  /**
   * Adds an effect sequence to the component with the specified ID.
   *
   * @param {string} componentId - The ID of the component.
   * @param {IEffectSequenceSettings} settings - The settings for the effect sequence.
   * @throws {Error} If a component with the same ID already exists.
   * @return {FX} The current instance of the FX class.
   */
  addEffectSequence(componentId, settings) {
    if (this._settingsCache.effectSequences[componentId])
      throw new Error(`ComponentId '${componentId}' already exists.`);
    this._settingsCache.effectSequences[componentId] = settings;
    this._nameMaps.effectSequences[settings.name] = settings;
    return this;
  }
  /**
   * Initializes a sprite with the specified component ID and settings.
   *
   * @param {string} componentId - The ID of the component.
   * @param {ISpriteSettings} settings - The settings for the sprite.
   * @throws {Error} Throws an error if the component ID already exists.
   * @returns {FX} Returns the current instance of the FX class.
   */
  initSprite(componentId, settings) {
    if (this._settingsCache.sprites[componentId])
      throw new Error(`ComponentId '${componentId}' already exists.`);
    this._settingsCache.sprites[componentId] = settings;
    return this;
  }
  /**
   * Initializes a movie clip with the specified component ID and settings.
   *
   * @param {string} componentId - The unique identifier for the movie clip component.
   * @param {IMovieClipSettings} settings - The settings for the movie clip.
   * @return {FX} The instance of the FX class.
   */
  initMovieClip(componentId, settings) {
    if (this._settingsCache.mcs[componentId])
      throw new Error(`ComponentId '${componentId}' already exists.`);
    this._settingsCache.mcs[componentId] = settings;
    return this;
  }
  /**
   * Retrieves the movie clips from the settings cache.
   *
   * @return {Object} An object containing movie clip settings.
   */
  getMovieClips() {
    return this._settingsCache.mcs;
  }
  /**
   * Retrieves the sprites from the settings cache.
   *
   * @return {Object} An object containing sprite settings.
   */
  getSprites() {
    return this._settingsCache.sprites;
  }
  /**
   * Adds a container to the __containers object with the specified key.
   *
   * @param {string} key - The key used to identify the container in the __containers object.
   * @param {PIXI.Container} container - The container to be added.
   */
  addContainer(key, container) {
    this.__containers[key] = container;
  }
  /**
   * Retrieves the EffectSequence object with the specified name.
   *
   * @param {string} name - The name of the EffectSequence to retrieve.
   * @return {EffectSequence} - The EffectSequence object with the specified name.
   */
  getEffectSequence(name) {
    const settings = this._nameMaps.effectSequences[name];
    if (!settings)
      throw new Error(`Settings not defined for '${name}'`);
    return this.getEffectSequenceById(settings.id);
  }
  /**
   * Retrieves an EffectSequence object by its component ID.
   *
   * @param {string} componentId - The ID of the component.
   * @return {EffectSequence} The retrieved EffectSequence object.
   */
  getEffectSequenceById(componentId) {
    const pool = this._cache.effectSequences;
    let effectSequence;
    let settings = this._settingsCache.effectSequences[componentId];
    if (!settings)
      throw new Error(`Settings not defined for '${componentId}'`);
    if (pool.length == 0) {
      effectSequence = new EffectSequence(componentId);
      effectSequence.__fx = this;
    } else {
      effectSequence = pool.pop();
    }
    effectSequence.__applySettings(settings);
    return effectSequence;
  }
  /**
   * Retrieves a particle emitter by its name.
   *
   * @param {string} name - The name of the particle emitter.
   * @param {boolean} autoRecycleOnComplete - (Optional) Specifies whether the emitter should auto recycle when complete. Default is true.
   * @param {boolean} cloneSettings - (Optional) Specifies whether the emitter settings should be cloned. Default is false.
   * @return {ParticleEmitter} The particle emitter with the specified name.
   */
  getParticleEmitter(name, autoRecycleOnComplete = true, cloneSettings = false) {
    const settings = this._nameMaps.emitters[name];
    if (!settings)
      throw new Error(`Settings not defined for '${name}'`);
    return this.getParticleEmitterById(settings.id, autoRecycleOnComplete, cloneSettings);
  }
  /**
   * Retrieves a particle emitter by its component ID.
   *
   * @param {string} componentId - The ID of the component.
   * @param {boolean} autoRecycleOnComplete - Whether the emitter should automatically recycle itself when it completes.
   * @param {boolean} cloneSettings - Whether to clone the settings object before applying them to the emitter.
   * @return {ParticleEmitter} The retrieved particle emitter.
   */
  getParticleEmitterById(componentId, autoRecycleOnComplete = true, cloneSettings = false) {
    const pool = this._cache.emitters;
    let emitter;
    let settings = this._settingsCache.emitters[componentId];
    if (!settings)
      throw new Error(`Settings not defined for '${componentId}'`);
    if (pool.length == 0) {
      emitter = new ParticleEmitter(componentId);
      emitter.__fx = this;
    } else {
      emitter = pool.pop();
    }
    if (cloneSettings) {
      settings = JSON.parse(JSON.stringify(settings));
    }
    emitter.autoRecycleOnComplete = autoRecycleOnComplete;
    emitter.__applySettings(settings);
    return emitter;
  }
  /**
   * Stops the specified particle emitter.
   *
   * @param {ParticleEmitter} emitter - The particle emitter to stop.
   * @param {boolean} [dispose=false] - Whether to dispose the emitter or recycle it.
   */
  stopEmitter(emitter, dispose = false) {
    if (emitter.list === this._effects) {
      this._effects.remove(emitter);
    }
    if (dispose) {
      emitter.dispose();
    } else {
      this.__recycleEmitter(emitter);
    }
  }
  /**
   * Stops all effects.
   *
   * @param {none} none - This function does not take any parameters.
   * @return {void} This function does not return a value.
   */
  stopAllEffects() {
    const list = this._effects.toArray();
    for (let node of list) {
      node.recycle();
    }
  }
  /**
   * Parses a sprite sheet.
   *
   * @param {PIXI.Spritesheet} spriteSheet - The sprite sheet to parse.
   * @param {string} filter - Optional filter to apply to the sprite sheet.
   * @return {IParseSpriteSheetResult} The result of parsing the sprite sheet.
   */
  parseSpriteSheet(spriteSheet, filter) {
    return this.parseObject(spriteSheet.data.frames, filter);
  }
  /**
   * Parses the texture cache and returns the result as an IParseSpriteSheetResult object.
   *
   * @param {string} [filter] - An optional parameter to filter the results.
   * @returns {IParseSpriteSheetResult} - The parsed sprite sheet result.
   */
  parseTextureCache(filter) {
    return this.parseObject(PIXI__namespace["Cache"]["_cache"], filter);
  }
  /**
   * Returns if the FX instance is active.
   *
   * @return {boolean} The value of the 'active' property.
   */
  get active() {
    return this._active;
  }
  // *********************************************************************************************
  // * Internal													                                        							   *
  // *********************************************************************************************
  __addActiveEffect(effect) {
    this._effects.add(effect);
  }
  __removeActiveEffect(effect) {
    this._effects.remove(effect);
  }
  __getSprite(componentId) {
    const cache = this._cache.sprites;
    let pool = cache[componentId];
    if (cache[componentId] == null) {
      pool = cache[componentId] = [];
    }
    if (pool.length == 0) {
      const settings = this._settingsCache.sprites[componentId];
      if (settings == null)
        throw new Error(`Settings not defined for '${componentId}'`);
      const sprite = new Sprite(componentId, settings.texture, settings.anchorX, settings.anchorY);
      sprite.__fx = this;
      return sprite;
    }
    return pool.pop();
  }
  __getMovieClip(componentId) {
    const cache = this._cache.mcs;
    let pool = cache[componentId];
    if (cache[componentId] == null) {
      pool = cache[componentId] = [];
    }
    if (pool.length == 0) {
      let settings = this._settingsCache.mcs[componentId];
      if (settings == null)
        throw new Error(`Settings not defined for '${componentId}'`);
      const mc = new MovieClip(componentId, settings.textures, settings.anchorX, settings.anchorY);
      mc.__fx = this;
      return mc;
    }
    return pool.pop();
  }
  __getParticle() {
    let cache = this._cache, pool = cache.particles;
    if (pool.length == 0) {
      const particle = new Particle();
      particle.__fx = this;
      return particle;
    }
    return pool.pop();
  }
  __getEmitterCore(type, emitter) {
    let cache = this._cache.cores;
    let pool = cache[type];
    if (pool == null) {
      pool = cache[type] = [];
    }
    if (pool.length == 0) {
      return new FX.__emitterCores[type](type);
    }
    return pool.pop();
  }
  __recycleParticle(particle) {
    this._cache.particles.push(particle);
  }
  __recycleSprite(componentId, object) {
    this._cache.sprites[componentId].push(object);
  }
  __recycleMovieClip(componentId, object) {
    this._cache.mcs[componentId].push(object);
  }
  __recycleEmitter(emitter) {
    this._effects.remove(emitter);
    this.__recycleEmitterCore(emitter.core);
    this._cache.emitters.push(emitter);
  }
  __recycleEffectSequence(effectSequence) {
    this._effects.remove(effectSequence);
    this._cache.effectSequences.push(effectSequence);
  }
  __recycleEmitterCore(core) {
    this._cache.cores[core.type].push(core);
  }
  // *********************************************************************************************
  // * Private													                               *
  // *********************************************************************************************
  parseObject(object, filter) {
    let frames;
    if (object instanceof Map) {
      frames = /* @__PURE__ */ new Map();
      const mapObject = object;
      mapObject.values();
      for (const [key, value] of mapObject) {
        if (value instanceof PIXI__namespace.Texture) {
          frames[key] = value;
        }
      }
    } else {
      frames = object;
    }
    const mcs = {};
    const result = { sprites: [], movieClips: [] };
    for (let i in frames) {
      if (filter && i.indexOf(filter) == -1) {
        continue;
      }
      this.initSprite(i, { texture: i, anchorX: 0.5, anchorY: 0.5 });
      result.sprites.push(i);
      if (i.substr(0, 3) == "mc_") {
        const parts = i.split("_");
        const group = parts[1];
        if (mcs[group] == null)
          mcs[group] = [];
        mcs[group].push(i);
      }
    }
    for (let i in mcs) {
      let textures = mcs[i];
      result.movieClips.push(i);
      this.initMovieClip(i, { textures, anchorX: 0.5, anchorY: 0.5 });
    }
    return result;
  }
}

exports.BaseEffect = BaseEffect;
exports.BaseEmitterCore = BaseEmitterCore;
exports.BoxEmitterCore = BoxEmitterCore;
exports.CircleEmitterCore = CircleEmitterCore;
exports.Color = Color;
exports.ComponentType = ComponentType;
exports.Easing = Easing;
exports.EffectSequence = EffectSequence;
exports.EffectSequenceComponentType = EffectSequenceComponentType;
exports.FX = FX;
exports.FXSignal = FXSignal;
exports.LinkedList = LinkedList;
exports.MovieClip = MovieClip;
exports.Particle = Particle;
exports.ParticleEmitter = ParticleEmitter;
exports.RingEmitterCore = RingEmitterCore;
exports.Rnd = Rnd;
exports.Sprite = Sprite;
//# sourceMappingURL=revoltfx.js.map
