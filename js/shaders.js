// Flick Cup 2026 · js/shaders.js
// The game's shader code in one place. Each entry is a piece of GLSL the game puts into a three.js material at a fixed
// spot (its "hook"); the files live in shaders/<name>.glsl (edited in Distal's Shaders tab) and the same code is written
// here as the fallback. shaders/shaders.json lists extra shaders made in Distal (for now: card shaders a rarity can use).
// Loaded by index.html as a classic script, in order: every file shares one scope, so names from earlier files work here.
'use strict';
const SHADER_DEF={
  kit_mask:{kind:'kit',stage:'fragment',hook:'after #include <map_fragment> (MeshStandardMaterial of the figures)',
    about:'Kit colours: the ID map (R shirt, G shorts, B socks) takes the team colours over the colour texture; the kit pattern mask takes the second colours.',
    names:'diffuseColor, vUv, uIdMap, uHasId, uShirt, uShorts, uSocks, uPat, uHasPat, uShirt2, uShorts2, uSocks2',
    src:`#ifdef USE_MAP
vec3 idm=uHasId>0.5?texture2D(uIdMap,vUv).rgb:vec3(smoothstep(0.45,0.7,min(min(diffuseColor.r,diffuseColor.g),diffuseColor.b)),0.,0.);
vec3 pm=uHasPat>0.5?texture2D(uPat,vUv).rgb:vec3(0.);
diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*mix(uShirt,uShirt2,pm.r),idm.r);
diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*mix(uShorts,uShorts2,pm.g),idm.g);
diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*mix(uSocks,uSocks2,pm.b),idm.b);
#endif
`},
  grass_blades:{kind:'grass',stage:'vertex',hook:'after #include <begin_vertex> (menu preview grass blades)',
    about:'Grass blades bend away from whatever stands in the middle and sway a little at the tip.',
    names:'transformed, uTime, uR',
    src:`float gh=max(transformed.y,0.0);vec2 gp=transformed.xz;float gd=length(gp);
float near=1.0-smoothstep(uR*0.8,uR*1.5,gd);
vec2 gdir=gd>1e-6?gp/gd:vec2(1.0,0.0);
transformed.xz+=gdir*gh*0.28*near;
transformed.y-=gh*0.05*near;
transformed.x+=sin(uTime*0.4+gp.x*420.0+gp.y*310.0)*gh*gh*40.0;
transformed.z+=cos(uTime*0.3+gp.y*380.0)*gh*gh*22.0;
`},
  grass_light:{kind:'grass',stage:'fragment',hook:'after #include <normal_fragment_begin> (menu preview grass)',
    about:'Grass is lit the same on both sides (no dark back faces).',
    names:'normal, viewMatrix',
    src:`normal=normalize(mix(normalize((viewMatrix*vec4(0.0,1.0,0.0,0.0)).xyz),vec3(0.0,0.0,1.0),0.55));
`},
  card_common:{kind:'card',stage:'fragment',hook:'card shader: cardUV() and cardColor() (the front of an Album card)',
    about:'Common cards: the art as it is.',
    names:'map (the art; its alpha is the mask), uTime, uStrength. V = view direction in card space: x right, y up, z out of the card',
    src:`// Common: plain art.
vec2 cardUV(vec2 uv, vec3 V){ return uv; }
vec3 cardColor(vec3 col, vec4 art, vec2 uv, vec3 V, vec3 N){ return col; }
`},
  card_foil:{kind:'card',stage:'fragment',hook:'card shader: cardUV() and cardColor() (the front of an Album card)',
    about:'Uncommon cards: a holographic foil that moves with the viewing angle. The art\'s alpha says where the foil is (white = foil).',
    names:'map (the art; its alpha is the mask), uTime, uStrength. V = view direction in card space: x right, y up, z out of the card',
    src:`// Uncommon: holographic foil where the art's alpha is white.
vec3 foilHue(float h){ return clamp(abs(fract(h+vec3(0.0,2.0/3.0,1.0/3.0))*6.0-3.0)-1.0,0.0,1.0); }
vec2 cardUV(vec2 uv, vec3 V){ return uv; }
vec3 cardColor(vec3 col, vec4 art, vec2 uv, vec3 V, vec3 N){
  float t = uv.x*1.4 + uv.y*0.8 + V.x*2.2 + V.y*1.4 + uTime*0.04;
  vec3 rainbow = foilHue(fract(t));
  float lines = 0.6 + 0.4*sin((uv.x - uv.y)*90.0 + V.x*14.0);
  float sheen = pow(clamp(1.0 - abs(V.x*1.6 + V.y*0.7), 0.0, 1.0), 4.0);
  float m = art.a * uStrength;
  return col*(1.0 - 0.15*m) + rainbow*(0.22*lines + 0.6*sheen)*m;
}
`},
  card_depth:{kind:'card',stage:'fragment',hook:'card shader: cardUV() and cardColor() (the front of an Album card)',
    about:'Rare cards: depth as flat cut-out layers, like a paper diorama. The art\'s alpha says how deep each part sits (white = front, black = back, each grey its own layer); the sides of the layers are not drawn.',
    names:'map (the art; its alpha is the depth), uTime, uStrength. V = view direction in card space: x right, y up, z out of the card',
    src:`// Rare: flat cut-out layers, like a paper diorama. The art's alpha says how deep each part sits:
// white = the front layer, black = the back of the card, each grey in between its own flat layer.
// Greys snap to LEVELS steps, so paint with a few clear greys (for 4 levels: 0, 85, 170, 255).
// The sides of the layers are never drawn; where a front piece no longer covers the back you see its shadow.
const int LEVELS = 4;          // how many flat layers (2 = just front and back)
const float SHADOW = 0.9;      // how dark the gap behind a cut piece is (0 = no shadow)
float cardGap = 0.0;
vec2 cardGapUv = vec2(0.0);
float cardLevel(vec2 p){ float n = float(LEVELS - 1); return floor(texture2D(map, p).a*n + 0.5)/n; }
vec2 cardUV(vec2 uv, vec3 V){
  float depth = 0.08*uStrength;
  vec2 dir = vec2(V.x, -V.y) / max(V.z, 0.3) * depth; // uv.y runs downwards
  float n = float(LEVELS - 1);
  cardGap = 0.0;
  vec2 p = uv;
  for(int j = 0; j < LEVELS; j++){             // front layer first
    float q = 1.0 - float(j)/n;                // this layer's level
    p = uv - dir*(1.0 - q);                    // where this layer is seen
    if(abs(cardLevel(p) - q) < 0.5/n){
      // a soft drop shadow from the layers in front of this one
      vec2 s = p + vec2(0.012, 0.016)*uStrength;
      if(cardLevel(s) > q + 0.5/n) cardGap = 0.45;
      return p;
    }
  }
  // the back of the card behind a cut piece: use the nearest back-layer colour, in shadow
  cardGap = 1.0;
  float lo = 0.0, hi = -1.0;                   // 0 = the back layer's spot, 1 = straight under the eye
  for(int k = 1; k <= 16; k++){
    if(hi < 0.0 && cardLevel(uv - dir*(1.0 - float(k)/16.0)) < 0.5/n) hi = float(k)/16.0;
  }
  cardGapUv = p;
  if(hi < 0.0) return p;
  lo = hi - 1.0/16.0;
  for(int k = 0; k < 6; k++){                  // find the edge of the cut piece exactly
    float m = 0.5*(lo + hi);
    if(cardLevel(uv - dir*(1.0 - m)) < 0.5/n) hi = m; else lo = m;
  }
  cardGapUv = uv - dir*(1.0 - hi);
  return cardGapUv;
}
vec3 cardColor(vec3 col, vec4 art, vec2 uv, vec3 V, vec3 N){
  float rim = pow(1.0 - clamp(V.z, 0.0, 1.0), 2.0);
  float shade = mix(0.7, 1.0, art.a);          // deeper layers a little darker
  float glint = pow(max(0.0, 1.0 - abs(uv.x + uv.y - 1.0 - V.x*0.8)), 24.0) * art.a;
  if(cardGap > 0.99){                         // soften the gap: a blurred copy of the back layer
    vec3 sharp = texture2D(map, cardGapUv).rgb, soft = texture2D(map, cardGapUv, 5.0).rgb;
    col *= clamp((soft + 0.02)/(sharp + 0.02), 0.0, 4.0);
  }
  col *= shade * (1.0 - SHADOW*cardGap);
  return col + vec3(1.0, 0.82, 0.38)*(rim*0.35 + glint*0.6)*uStrength*(1.0 - cardGap);
}
`},
  card_depth_smooth:{kind:'card',stage:'fragment',hook:'card shader: cardUV() and cardColor() (the front of an Album card)',
    about:'The first Rare depth: a smooth height map, the sides of each shape show as a stretched extrusion. Kept to compare (Rare uses card_depth).',
    names:'map (the art; its alpha is the height), uTime, uStrength. V = view direction in card space: x right, y up, z out of the card',
    src:`// Rare: parallax depth. The art's alpha is the height (white at the front, black at the back).
vec2 cardUV(vec2 uv, vec3 V){
  float depth = 0.08*uStrength;
  vec2 dir = vec2(V.x, -V.y) / max(V.z, 0.3) * depth; // uv.y runs downwards
  const int STEPS = 24;
  float layer = 1.0/float(STEPS), d = 0.0;
  vec2 cur = uv, prev = uv; float prevGap = 0.0;
  for(int i = 0; i < STEPS; i++){
    float gap = (1.0 - texture2D(map, cur).a) - d;
    if(gap <= 0.0){ float w = prevGap/(prevGap - gap + 1e-5); return mix(prev, cur, w); }
    prev = cur; prevGap = gap; d += layer; cur -= dir*layer;
  }
  return cur;
}
vec3 cardColor(vec3 col, vec4 art, vec2 uv, vec3 V, vec3 N){
  float rim = pow(1.0 - clamp(V.z, 0.0, 1.0), 2.0);
  float shade = mix(0.55, 1.0, art.a);            // deeper is darker
  float glint = pow(max(0.0, 1.0 - abs(uv.x + uv.y - 1.0 - V.x*0.8)), 24.0) * art.a;
  return col*shade + vec3(1.0, 0.82, 0.38)*(rim*0.35 + glint*0.6)*uStrength;
}
`},
};
const SHADERS={};Object.entries(SHADER_DEF).forEach(([k,d])=>SHADERS[k]={kind:d.kind,stage:d.stage,hook:d.hook,about:d.about,names:d.names,src:d.src,file:false,gen:0});
let SHADER_GEN=0;
const shaderSrc=name=>(SHADERS[name]||{}).src||'';
const shaderKey=name=>name+'@'+((SHADERS[name]||{}).gen||0);
// materials remember which shaders they use (userData.shaders); a change recompiles them
const SHADER_USERS=new Set();
function shaderUse(mat,...names){mat.userData.shaders=names;SHADER_USERS.add(mat);return mat;}
function shaderChanged(name){const S=SHADERS[name];if(!S)return;S.gen++;SHADER_GEN++;
  SHADER_USERS.forEach(m=>{if((m.userData.shaders||[]).includes(name))m.needsUpdate=true;});
  if(typeof onShaderChanged==='function')try{onShaderChanged(name);}catch(e){}}
// a shader's new code (shaders/<name>.glsl, or live from Distal); extra entries for shaders made in Distal
function setShader(name,src,meta){if(!/^[a-z0-9_]{1,40}$/.test(name)||typeof src!=='string')return false;
  if(!SHADERS[name])SHADERS[name]={kind:(meta&&meta.kind)||'card',stage:'fragment',hook:SHADER_DEF.card_common.hook,about:(meta&&meta.about)||'Made in Distal.',names:SHADER_DEF.card_common.names,src,file:true,gen:0};
  const S=SHADERS[name];S.file=true;if(meta&&meta.about)S.about=meta.about;if(S.src===src)return true;S.src=src;shaderChanged(name);return true;}
function shaderNames(kind){return Object.keys(SHADERS).filter(k=>!kind||SHADERS[k].kind===kind);}
(function loadShaderFiles(){
  const get=n=>fetch('shaders/'+n+'.glsl',{cache:'no-store'}).then(r=>r.ok?r.text():null).catch(()=>null);
  fetch('shaders/shaders.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null).then(man=>{
    const extra=(man&&Array.isArray(man.shaders)?man.shaders:[]).filter(x=>x&&/^[a-z0-9_]{1,40}$/.test(x.name));
    const names=[...new Set([...Object.keys(SHADER_DEF),...extra.map(x=>x.name)])];
    names.forEach(n=>get(n).then(t=>{if(t!=null)setShader(n,t,extra.find(x=>x.name===n));}));});
})();
// what Distal's Shaders tab needs (link.js D.shaderMeta)
function shaderMeta(){return Object.entries(SHADERS).map(([name,S])=>({name,kind:S.kind,stage:S.stage,hook:S.hook,about:S.about,names:S.names,file:S.file,builtin:!!SHADER_DEF[name],src:S.src,def:SHADER_DEF[name]?SHADER_DEF[name].src:null}));}
