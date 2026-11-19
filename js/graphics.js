// Flick Cup 2026 · js/graphics.js
// Graphics settings: quality presets (Low, Medium, High, Ultra, Steam Deck) and the global look of the game.
// data/graphics.json (edited in Distal > Scene > Graphics):
//   look:     global, the same on every preset: tone mapping and exposure, AgX curve, colour grade, lens (chromatic
//             aberration, vignette, softness, grain, VHS), and the strength of each effect (AO, bounce light,
//             reflections, bloom, depth of field, dust).
//   presets:  {low, medium, high, ultra, deck}: which effects run and how well (render scale, anti-aliasing, shadows,
//             AO, reflections, bounce light, bloom, depth of field, lens effects, dust, frame cap).
//   expose:   {key: true} the preset settings a player can change in Settings > Graphics.
//   defaults: {desktop, touch, deck} the preset a fresh player starts on (deck = the Steam Deck build).
// The post chain (three r128 examples, bundled in lib/three-post.js):
//   normals + depth → Render | SSR → AO → bounce light → depth of field → bloom → tone map + grade → lens → grain → FXAA | SMAA
// With "Post effects" off (Low) the table is drawn straight, as before, with three's own tone mapping.
// Replaces the old Quality chips (js/settings.js applyGraphics). Loaded by index.html after rulesdata.js, as a
// classic script: every file shares one scope.
'use strict';
const GFX_TONES=['ACES','AgX','AgX custom','Neutral','Reinhard','Cineon','Linear','None'];
const GFX_PRESETS=['low','medium','high','ultra','deck'];
const GFX_PNAME={low:'Low',medium:'Medium',high:'High',ultra:'Ultra',deck:'Steam Deck'};
// the settings: [key, label, help, type, a, b, step] (range: min, max, step · select: options)
const GFX_PCAT=[
  ['post','Post effects','Off = the table drawn straight (cheapest). Every effect below needs it.','toggle'],
  ['scale','Render scale','Share of the screen resolution the table is drawn at.','range',50,100,5],
  ['dpr','Max pixel density','Caps the pixel ratio on sharp screens (phones, iPad, Retina).','range',1,3,0.25],
  ['fps','Frame cap','0 = no cap. Saves battery on handhelds.','select',[0,30,40,60]],
  ['aa','Anti-aliasing','Smooths edges. FXAA is cheapest, MSAA 4x the sharpest.','select',['Off','FXAA','SMAA','MSAA 4x']],
  ['shadows','Shadows','','toggle'],
  ['shadowRes','Shadow detail','Shadow map size.','select',[1024,2048,4096]],
  ['shadowSoft','Soft shadow edges','','toggle'],
  ['ssao','Ambient occlusion','Soft contact shadows where figures meet the cloth and the borders.','toggle'],
  ['ssaoQ','AO quality','1 = half resolution, 8 samples · 2 = half, 16 · 3 = full, 16.','range',1,3,1],
  ['ssgi','Bounce light','Colour bleeding from nearby surfaces (approximate).','toggle'],
  ['ssr','Reflections','Screen-space reflections on glossy surfaces. Heavy.','toggle'],
  ['ssrQ','Reflection quality','1 low · 2 medium · 3 high (no blur).','range',1,3,1],
  ['bloom','Bloom','Glow around bright lights and flashes.','toggle'],
  ['bloomQ','Bloom quality','1 = half resolution · 2 = full.','range',1,2,1],
  ['dof','Depth of field','Cinematic = title screen, kick-off fly-in and goals only. Always = in play too (focus set in Look > Depth of field).','select',['Off','Cinematic','Always']],
  ['lens','Film effects','Vignette, chromatic aberration, lens softness, grain, VHS.','toggle'],
  ['dust','Dust in the air','Drifting dust motes over the table.','toggle'],
  ['felt','Felt fibres','Short fur on the cloth (GPU instanced shell layers). Shows in close-ups.','toggle'],
  ['feltLayers','Felt layers','More layers = smoother fibres, slower.','range',4,24,1],
  ['puffs','Felt kick-up','Green felt fibres flicked out when a figure skates, stops or starts.','toggle'],
  ['clothDetail','Cloth detail','High-resolution felt weave on the cloth, on top of the field texture (any field).','toggle'],
  ['aniso','Texture filtering','Anisotropic filtering: keeps the cloth and the table sharp at low camera angles.','select',[1,2,4,8,16]],
  ['linesRes','Pitch lines resolution','Width in pixels of the pitch markings texture.','select',[2048,4096]],
];
const GFX_LCAT=[
  ['Tone',[['tone','Tone mapping','How bright light is squeezed into the screen.','select',GFX_TONES],['exposure','Exposure','On top of the scene exposure (Scene > Environment).','range',0.2,3,0.01]]],
  ['AgX custom curve',[['agx.contrast','Contrast','','range',0.5,4,0.01],['agx.toe','Toe','','range',0.5,8,0.01],['agx.shoulder','Shoulder','','range',0.5,8,0.01],['agx.pivot','Pivot','','range',0.2,0.9,0.001],['agx.mid','Mid level','','range',0.2,0.9,0.001],['agx.saturation','Saturation','','range',0,2,0.01],['agx.slope','Slope','','range',0.5,1.5,0.01],['agx.offset','Offset','','range',-0.2,0.2,0.001],['agx.power','Power','','range',0.5,2,0.01]]],
  ['Colour grade',[['grade.saturation','Saturation','','range',0,2,0.01],['grade.contrast','Contrast','','range',0.5,1.5,0.01],['grade.temperature','Temperature','Cool (-) to warm (+).','range',-1,1,0.01],['grade.tint','Tint','Green (-) to magenta (+).','range',-1,1,0.01],['grade.lift','Lift (blacks)','','range',-0.1,0.1,0.001],['grade.gain','Gain (whites)','','range',0.5,1.5,0.01]]],
  ['Lens',[['lens.ca','Chromatic aberration','','range',0,2,0.01],['lens.vignette','Vignette','','range',0,1,0.01],['lens.vignetteSoft','Vignette softness','','range',0.05,0.8,0.01],['lens.softness','Lens softness','Blur toward the edges, like a vintage lens.','range',0,1.5,0.01],['lens.grain','Film grain','','range',0,1,0.01],['lens.grainSize','Grain size','','range',1,4,0.1]]],
  ['VHS',[['vhs.tracking','Tracking','','range',0,1,0.01],['vhs.bleed','Chroma bleed','','range',0,1,0.01],['vhs.desat','Desaturate','','range',0,1,0.01],['vhs.tint','Tint','','range',0,1,0.01],['vhs.lift','Black lift','','range',0,1,0.01],['vhs.scanlines','Scanlines','','range',0,1,0.01],['vhs.noise','Tape noise','','range',0,1,0.01]]],
  ['Ambient occlusion',[['ao.intensity','Intensity','','range',0,3,0.01],['ao.radius','Radius','World units (a figure base is about 3).','range',0.5,12,0.1]]],
  ['Bounce light',[['ssgi.intensity','Intensity','','range',0,3,0.01],['ssgi.radius','Radius','Pixels at a distance of 1.','range',5,120,1]]],
  ['Reflections',[['ssr.intensity','Intensity','','range',0,1,0.01],['ssr.maxRough','Up to roughness','Only surfaces this glossy or more reflect.','range',0,1,0.01],['ssr.distance','Max distance','','range',2,200,1]]],
  ['Bloom',[['bloom.strength','Strength','','range',0,2,0.01],['bloom.radius','Radius','','range',0,1,0.01],['bloom.threshold','Threshold','Brightness (HDR) where glow starts.','range',0,4,0.01]]],
  ['Depth of field',[['dof.target','Focus on','Ball and selected player keeps both sharp: the sharp zone stretches to cover the distance between them.','select',['Ball and selected player','Ball','Selected player','Camera target','Fixed distance']],['dof.range','Sharp zone','Extra depth kept sharp around the focus (world units).','range',0,60,0.5],['dof.focus','Focus distance','For Fixed distance.','range',10,400,1],['dof.aperture','Aperture','How fast things blur outside the sharp zone.','range',0,10,0.01],['dof.maxblur','Max blur','Cap on the blur (keep it low for play).','range',0,10,0.01],['dof.speed','Focus speed','How fast the focus follows.','range',0.5,20,0.1]]],
  ['Dust',[['dust.amount','Amount','','range',0,1,0.01],['dust.size','Size','','range',0.2,3,0.01],['dust.brightness','Brightness','','range',0,2,0.01]]],
  ['Felt fibres',[['felt.height','Pile height','World units (a figure base is about 3 across).','range',0.05,1.2,0.01],['felt.density','Density','Fibres per world unit.','range',1,20,0.1],['felt.shade','Root shadow','How dark the cloth gets between fibres.','range',0,1,0.01],['felt.sheen','Sheen','Light on the fibre tips, stronger at low angles.','range',0,1.5,0.01],['felt.lean','Lean','How much the fibres lie over (brushed felt).','range',0,1,0.01],['felt.fade','Distance fade','Fibres fade where they get smaller than a pixel.','range',0.2,2,0.01]]],
  ['Cloth detail',[['cloth.amount','Strength','','range',0,1,0.01],['cloth.scale','Tile size','World units one detail tile covers (smaller = finer).','range',2,40,0.1],['cloth.fine','Fine fibres','Share of the second, finer layer.','range',0,1,0.01],['cloth.rough','Roughness variation','','range',0,0.5,0.01]]],
  ['Felt kick-up',[['puff.style','Style','Fibres: short green felt fibres flicked out from the base, like turf. Dust: soft clouds.','select',['Fibres','Dust']],['puff.amount','Amount','','range',0,3,0.01],['puff.size','Size','','range',0.2,3,0.01],['puff.life','Life','Seconds.','range',0.2,2.5,0.01],['puff.opacity','Opacity','','range',0,1,0.01],['puff.tint','Tint','0 = pale dust, 1 = cloth green.','range',0,1,0.01],['puff.ball','Ball puffs','Share of puffs the ball makes.','range',0,1,0.01]]],
];
const GFX_DEF={version:1,
  look:{tone:'ACES',exposure:1,
    agx:{contrast:1.95,toe:3.9,shoulder:3.81,pivot:0.639,mid:0.563,saturation:1,slope:1,offset:0,power:1},
    grade:{saturation:1,contrast:1,temperature:0,tint:0,lift:0,gain:1},
    lens:{ca:0.25,vignette:0.3,vignetteSoft:0.55,softness:0.2,grain:0.12,grainSize:1.5},
    vhs:{tracking:0,bleed:0,desat:0,tint:0,lift:0,scanlines:0,noise:0},
    ao:{intensity:1.4,radius:4},ssgi:{intensity:0.6,radius:40},ssr:{intensity:0.5,maxRough:0.35,distance:40},
    bloom:{strength:0.25,radius:0.4,threshold:1},dof:{target:'Ball and selected player',range:8,focus:150,aperture:2.5,maxblur:2,speed:6},dust:{amount:0.5,size:1,brightness:0.5},
    felt:{height:0.3,density:9,shade:0.3,sheen:0.3,lean:0.45,fade:1},cloth:{amount:0.35,scale:9,fine:0.45,rough:0.12},puff:{style:'Fibres',amount:1,size:1.1,life:0.7,opacity:0.6,tint:1,ball:0.5}},
  presets:{
    low:{post:false,scale:75,dpr:1,fps:0,aa:'FXAA',shadows:true,shadowRes:1024,shadowSoft:false,ssao:false,ssaoQ:1,ssgi:false,ssr:false,ssrQ:1,bloom:false,bloomQ:1,dof:'Off',lens:false,dust:false,felt:false,feltLayers:6,puffs:true,clothDetail:false,aniso:4,linesRes:2048},
    medium:{post:true,scale:90,dpr:1.5,fps:0,aa:'FXAA',shadows:true,shadowRes:2048,shadowSoft:true,ssao:true,ssaoQ:1,ssgi:false,ssr:false,ssrQ:1,bloom:true,bloomQ:1,dof:'Cinematic',lens:true,dust:false,felt:true,feltLayers:8,puffs:true,clothDetail:true,aniso:8,linesRes:4096},
    high:{post:true,scale:100,dpr:2,fps:0,aa:'SMAA',shadows:true,shadowRes:2048,shadowSoft:true,ssao:true,ssaoQ:2,ssgi:false,ssr:false,ssrQ:1,bloom:true,bloomQ:2,dof:'Cinematic',lens:true,dust:true,felt:true,feltLayers:12,puffs:true,clothDetail:true,aniso:16,linesRes:4096},
    ultra:{post:true,scale:100,dpr:2.5,fps:0,aa:'MSAA 4x',shadows:true,shadowRes:4096,shadowSoft:true,ssao:true,ssaoQ:3,ssgi:true,ssr:true,ssrQ:2,bloom:true,bloomQ:2,dof:'Cinematic',lens:true,dust:true,felt:true,feltLayers:16,puffs:true,clothDetail:true,aniso:16,linesRes:4096},
    deck:{post:true,scale:100,dpr:1,fps:0,aa:'FXAA',shadows:true,shadowRes:2048,shadowSoft:true,ssao:true,ssaoQ:1,ssgi:false,ssr:false,ssrQ:1,bloom:true,bloomQ:1,dof:'Cinematic',lens:true,dust:false,felt:true,feltLayers:8,puffs:true,clothDetail:true,aniso:8,linesRes:2048}},
  expose:{scale:true,aa:true,shadows:true,ssao:true,bloom:true,dof:true,lens:true,fps:true,felt:true,puffs:true,clothDetail:true,aniso:true},
  defaults:{desktop:'high',touch:'medium',deck:'deck'}};
const GFX={data:JSON.parse(JSON.stringify(GFX_DEF)),P:null,L:null,preset:'high',force:'',built:null,broken:false,
  sceneTone:THREE.ACESFilmicToneMapping,cine:0,cineFocus:null,lastDraw:0,shadowSig:'',warned:false,
  deck:!!(window.FLICK_BUILD&&window.FLICK_BUILD.platform==='steamdeck'),
  touch:matchMedia('(pointer:coarse)').matches&&!matchMedia('(pointer:fine)').matches};
const gfxGet=(o,p)=>p.split('.').reduce((a,k)=>a==null?undefined:a[k],o);
// deep-merge a file over the defaults, keeping only known keys and the default's type
function gfxClean(o){const out=JSON.parse(JSON.stringify(GFX_DEF));if(!o||typeof o!=='object')return out;
  const deep=(t,s)=>{if(!s||typeof s!=='object')return;Object.keys(t).forEach(k=>{if(!(k in s))return;const v=s[k],d=t[k];
    if(d&&typeof d==='object'&&!Array.isArray(d))deep(d,v);else if(typeof d==='number'){if(isFinite(+v)&&v!==null&&v!=='')t[k]=+v;}
    else if(typeof d==='boolean')t[k]=!!v;else if(typeof d==='string'&&typeof v==='string')t[k]=v;});};
  deep(out.look,o.look);GFX_PRESETS.forEach(p=>deep(out.presets[p],o.presets&&o.presets[p]));
  if(o.expose&&typeof o.expose==='object'){out.expose={};GFX_PCAT.forEach(([k])=>{if(o.expose[k])out.expose[k]=true;});if(o.expose.deckPreset)out.expose.deckPreset=true;}
  if(o.defaults&&typeof o.defaults==='object')['desktop','touch','deck'].forEach(k=>{if(GFX_PRESETS.includes(o.defaults[k]))out.defaults[k]=o.defaults[k];});
  return out;}
// the player's choice (Settings > Graphics): SET.gfx = {p: 'auto' | preset id, o: {key: value} for exposed settings}
function gfxPlayer(){if(!SET.gfx||typeof SET.gfx!=='object')SET.gfx={p:'auto',o:{}};if(!SET.gfx.o||typeof SET.gfx.o!=='object')SET.gfx.o={};return SET.gfx;}
function gfxAuto(){const d=GFX.data.defaults;return GFX.deck?d.deck:GFX.touch?d.touch:d.desktop;}
function gfxEffective(){
  const D=GFX.data,pl=gfxPlayer();
  let id=GFX.force||(pl.p==='auto'||!D.presets[pl.p]?gfxAuto():pl.p);if(!D.presets[id])id='high';
  const P=Object.assign({},D.presets[id]);
  if(!GFX.force)Object.keys(pl.o).forEach(k=>{if(D.expose[k]&&k in P)P[k]=pl.o[k];});
  GFX.preset=id;GFX.P=P;GFX.L=D.look;return P;}
// ---------------- shaders ----------------
const GFX_VS='varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
const GFX_HASH='float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}';
function gfxAoMat(n){
  const k=[];for(let i=0;i<n;i++){const v=new THREE.Vector3(Math.random()*2-1,Math.random()*2-1,Math.random());v.normalize();let s=i/n;s=0.1+0.9*s*s;v.multiplyScalar(s*(0.5+Math.random()*0.5));k.push(v);}
  return new THREE.ShaderMaterial({defines:{KS:n},uniforms:{tDepth:{value:null},tNormal:{value:null},kernel:{value:k},proj:{value:new THREE.Matrix4()},invProj:{value:new THREE.Matrix4()},near:{value:1},far:{value:1000},radius:{value:3},time:{value:0},res:{value:new THREE.Vector2()}},
    vertexShader:GFX_VS,fragmentShader:`#include <packing>
uniform sampler2D tDepth,tNormal;uniform vec3 kernel[KS];uniform mat4 proj,invProj;uniform float near,far,radius,time;uniform vec2 res;varying vec2 vUv;${GFX_HASH}
vec3 vpos(vec2 uv,float d){vec4 c=vec4(vec3(uv,d)*2.-1.,1.);vec4 v=invProj*c;return v.xyz/v.w;}
float vz(vec2 uv){return perspectiveDepthToViewZ(texture2D(tDepth,uv).x,near,far);}
void main(){float d=texture2D(tDepth,vUv).x;if(d>=1.){gl_FragColor=vec4(1.);return;}
vec3 P=vpos(vUv,d),N=normalize(unpackRGBToNormal(texture2D(tNormal,vUv).xyz));
float a=h(floor(vUv*res)+fract(time))*6.2831;vec3 r=vec3(cos(a),sin(a),0.);vec3 T=normalize(r-N*dot(r,N)),B=cross(N,T);mat3 M=mat3(T,B,N);
float occ=0.;for(int i=0;i<KS;i++){vec3 S=P+M*kernel[i]*radius;vec4 o=proj*vec4(S,1.);vec2 uv=o.xy/o.w*.5+.5;
if(uv.x<0.||uv.y<0.||uv.x>1.||uv.y>1.)continue;float sz=vz(uv);float rc=smoothstep(0.,1.,radius/max(abs(P.z-sz),1e-3));occ+=(sz>=S.z+radius*.03?1.:0.)*rc;}
gl_FragColor=vec4(vec3(1.-occ/float(KS)),1.);}`});}
const GFX_AOBLUR={uniforms:{tAo:{value:null},tDepth:{value:null},near:{value:1},far:{value:1000},res:{value:new THREE.Vector2()},tDiffuse:{value:null},intensity:{value:1}},
  vertexShader:GFX_VS,fragmentShader:`#include <packing>
uniform sampler2D tAo,tDepth,tDiffuse;uniform float near,far,intensity;uniform vec2 res;varying vec2 vUv;
float vz(vec2 uv){return perspectiveDepthToViewZ(texture2D(tDepth,uv).x,near,far);}
void main(){vec4 c=texture2D(tDiffuse,vUv);float z0=vz(vUv),s=0.,w=0.;
for(int x=-2;x<=1;x++)for(int y=-2;y<=1;y++){vec2 uv=vUv+(vec2(float(x),float(y))+.5)/res;float wz=exp(-abs(vz(uv)-z0)*.8);s+=texture2D(tAo,uv).r*wz;w+=wz;}
float ao=w>0.?s/w:1.;gl_FragColor=vec4(c.rgb*pow(clamp(ao,0.,1.),intensity),c.a);}`};
const GFX_SSGI={uniforms:{tDiffuse:{value:null},tDepth:{value:null},tNormal:{value:null},resolution:{value:new THREE.Vector2()},cameraNear:{value:1},cameraFar:{value:1000},intensity:{value:0.6},radius:{value:40},time:{value:0}},
  vertexShader:GFX_VS,fragmentShader:`#include <packing>
uniform sampler2D tDiffuse,tDepth,tNormal;uniform vec2 resolution;uniform float cameraNear,cameraFar,intensity,radius,time;varying vec2 vUv;${GFX_HASH}
float viewZ(vec2 uv){return perspectiveDepthToViewZ(texture2D(tDepth,uv).x,cameraNear,cameraFar);}
vec3 nrm(vec2 uv){return normalize(texture2D(tNormal,uv).xyz*2.-1.);}
void main(){vec4 base=texture2D(tDiffuse,vUv);float d0=texture2D(tDepth,vUv).x;if(d0>=1.||intensity<=0.){gl_FragColor=base;return;}
float z0=viewZ(vUv);vec3 n0=nrm(vUv);vec3 acc=vec3(0.);float wsum=0.;float rot=h(vUv*resolution+time)*6.2831;float rpx=radius*100./max(-z0,0.5);
for(int i=0;i<16;i++){float fi=float(i)+.5,a=rot+fi*2.39996,r=sqrt(fi/16.)*rpx;vec2 suv=vUv+vec2(cos(a),sin(a))*r/resolution;
if(suv.x<0.||suv.y<0.||suv.x>1.||suv.y>1.)continue;float zs=viewZ(suv);vec3 ns=nrm(suv);float wz=exp(-abs(zs-z0)*.06);float wn=clamp(1.-dot(ns,n0),0.,1.);float w=wz*(.25+.75*wn);acc+=texture2D(tDiffuse,suv).rgb*w;wsum+=w;}
vec3 bounce=wsum>0.?acc/wsum:vec3(0.);float lb=dot(bounce,vec3(.299,.587,.114)),l0=dot(base.rgb,vec3(.299,.587,.114));
vec3 albedo=base.rgb/max(max(base.r,max(base.g,base.b)),.25);vec3 bleed=(bounce-vec3(lb))*albedo;float rel=clamp(lb-l0,-.5,.5)*.25;
gl_FragColor=vec4(max(base.rgb+intensity*(bleed*.6+base.rgb*rel),0.),base.a);}`};
// tone mapping (ACES, AgX, AgX custom, Neutral, Reinhard, Cineon, Linear, None), exposure, grade, linear to sRGB
const GFX_OUT={uniforms:{tDiffuse:{value:null},exposure:{value:1},tone:{value:0},
    agxContrast:{value:1.95},agxToe:{value:3.9},agxShoulder:{value:3.81},agxPivot:{value:0.639},agxMid:{value:0.563},agxSat:{value:1},agxSlope:{value:1},agxOffset:{value:0},agxPower:{value:1},
    sat:{value:1},con:{value:1},temp:{value:0},tint:{value:0},lift:{value:0},gain:{value:1}},
  vertexShader:GFX_VS,fragmentShader:`uniform sampler2D tDiffuse;uniform float exposure,tone,agxContrast,agxToe,agxShoulder,agxPivot,agxMid,agxSat,agxSlope,agxOffset,agxPower,sat,con,temp,tint,lift,gain;varying vec2 vUv;
const mat3 S2R=mat3(vec3(0.6274,0.0691,0.0164),vec3(0.3293,0.9195,0.0880),vec3(0.0433,0.0113,0.8956));
const mat3 R2S=mat3(vec3(1.6605,-0.1246,-0.0182),vec3(-0.5876,1.1329,-0.1006),vec3(-0.0728,-0.0083,1.1187));
const mat3 AgIn=mat3(vec3(0.856627153315983,0.137318972929847,0.11189821299995),vec3(0.0951212405381588,0.761241990602591,0.0767994186031903),vec3(0.0482516061458583,0.101439036467562,0.811302368396859));
const mat3 AgOut=mat3(vec3(1.1271005818144368,-0.1413297634984383,-0.14132976349843826),vec3(-0.11060664309660323,1.157823702216272,-0.11060664309660294),vec3(-0.016493938717834573,-0.016493938717834257,1.2519364065950405));
vec3 rrt(vec3 v){vec3 a=v*(v+0.0245786)-0.000090537;vec3 b=v*(0.983729*v+0.4329510)+0.238081;return a/b;}
vec3 aces(vec3 c){const mat3 I=mat3(vec3(0.59719,0.07600,0.02840),vec3(0.35458,0.90834,0.13383),vec3(0.04823,0.01566,0.83777));
  const mat3 O=mat3(vec3(1.60475,-0.10208,-0.00327),vec3(-0.53108,1.10813,-0.07276),vec3(-0.07367,-0.00605,1.07602));c/=0.6;c=I*c;c=rrt(c);c=O*c;return clamp(c,0.,1.);}
vec3 agxPoly(vec3 x){vec3 x2=x*x,x4=x2*x2;return 15.5*x4*x2-40.14*x4*x+31.96*x4-6.868*x2*x+0.4298*x2+0.1191*x-0.00232;}
float agxSig(float x){float d=agxContrast*(x-agxPivot);float lim=d<0.?agxMid:1.-agxMid,pw=d<0.?agxToe:agxShoulder;return d/pow(1.+pow(abs(d)/lim,pw),1./pw)+agxMid;}
vec3 agx(vec3 c,bool custom){c=S2R*c;c=AgIn*c;c=clamp((log2(max(c,1e-10))+12.47393)/16.499999,0.,1.);
  if(custom){c=vec3(agxSig(c.r),agxSig(c.g),agxSig(c.b));c=pow(max(c*agxSlope+agxOffset,0.),vec3(agxPower));float l=dot(c,vec3(0.2126,0.7152,0.0722));c=l+agxSat*(c-l);}else c=agxPoly(c);
  c=AgOut*c;c=pow(max(vec3(0.),c),vec3(2.2));c=R2S*c;return clamp(c,0.,1.);}
vec3 neutral(vec3 c){const float S=0.76,D=0.15;float x=min(c.r,min(c.g,c.b));float off=x<0.08?x-6.25*x*x:0.04;c-=off;float pk=max(c.r,max(c.g,c.b));if(pk<S)return c;
  float d=1.-S;float np=1.-d*d/(pk+d-S);c*=np/pk;float g=1.-1./(D*(pk-np)+1.);return mix(c,vec3(np),g);}
vec3 toSRGB(vec3 c){c=max(c,0.);return mix(pow(c,vec3(0.41666))*1.055-0.055,c*12.92,step(c,vec3(0.0031308)));}
void main(){vec4 t=texture2D(tDiffuse,vUv);vec3 c=t.rgb*exposure;
  c*=vec3(1.+temp*.12+tint*.05,1.-tint*.1,1.-temp*.12+tint*.05);
  int m=int(tone+.5);
  if(m==0)c=aces(c);else if(m==1)c=agx(c,false);else if(m==2)c=agx(c,true);else if(m==3)c=clamp(neutral(c),0.,1.);
  else if(m==4)c=clamp(c/(1.+c),0.,1.);else if(m==5){c=max(vec3(0.),c-0.004);c=pow((c*(6.2*c+.5))/(c*(6.2*c+1.7)+.06),vec3(2.2));}else if(m==6)c=clamp(c,0.,1.);
  c=toSRGB(c);
  c=c*gain+lift;c=(c-.5)*con+.5;float l=dot(c,vec3(.299,.587,.114));c=mix(vec3(l),c,sat);
  gl_FragColor=vec4(clamp(c,0.,1.),1.);}`};
// display-space lens: chromatic aberration, lens softness, VHS (tracking, bleed, desaturate, tint, black lift, scanlines, noise), vignette
const GFX_LENS={uniforms:{tDiffuse:{value:null},resolution:{value:new THREE.Vector2()},time:{value:0},ca:{value:0},vignette:{value:0.3},vignetteSoft:{value:0.55},softness:{value:0},
    vTrack:{value:0},vBleed:{value:0},vDesat:{value:0},vTint:{value:0},vLift:{value:0},vScan:{value:0},vNoise:{value:0}},
  vertexShader:GFX_VS,fragmentShader:`uniform sampler2D tDiffuse;uniform vec2 resolution;uniform float time,ca,vignette,vignetteSoft,softness,vTrack,vBleed,vDesat,vTint,vLift,vScan,vNoise;varying vec2 vUv;${GFX_HASH}
void main(){vec2 uv=vUv,c=uv-.5;
uv.x+=vTrack*.004*sin(uv.y*240.+time*9.)*step(.75,h(vec2(floor(uv.y*60.),floor(time*4.))));
vec2 off=c*ca*.012;vec3 col=vec3(texture2D(tDiffuse,uv+off).r,texture2D(tDiffuse,uv).g,texture2D(tDiffuse,uv-off).b);
if(softness>0.){float r2=dot(c,c)*4.;vec2 px=softness*r2*3./resolution;vec3 a=col;
a+=texture2D(tDiffuse,uv+vec2(px.x,px.y)).rgb+texture2D(tDiffuse,uv+vec2(-px.x,px.y)).rgb+texture2D(tDiffuse,uv+vec2(px.x,-px.y)).rgb+texture2D(tDiffuse,uv+vec2(-px.x,-px.y)).rgb+texture2D(tDiffuse,uv+vec2(px.x*1.6,0.)).rgb+texture2D(tDiffuse,uv-vec2(px.x*1.6,0.)).rgb;col=a/7.;}
float Y=dot(col,vec3(.299,.587,.114));
if(vBleed>0.){vec3 bl=vec3(0.);for(int i=-3;i<=3;i++)bl+=texture2D(tDiffuse,uv+vec2(float(i)*2./resolution.x,0.)).rgb;bl/=7.;float Yb=dot(bl,vec3(.299,.587,.114));col=mix(col,vec3(Y)+(bl-vec3(Yb)),vBleed);}
col=mix(col,vec3(dot(col,vec3(.299,.587,.114))),vDesat);
vec3 tw=col*vec3(1.06,1.,.9);tw=mix(tw,tw*vec3(.9,1.02,1.06),smoothstep(.5,0.,Y));col=mix(col,tw,vTint);
col=col*(1.-vLift*.12)+vLift*vec3(.07,.045,.1);
col*=1.-vScan*.14*(.5+.5*sin(gl_FragCoord.y*3.14159));
col+=(h(gl_FragCoord.xy+time)-.5)*vNoise*.09;
float vg=smoothstep(.8,.8-vignetteSoft,length(c*vec2(1.,.9)));col*=mix(1.,vg,vignette);
gl_FragColor=vec4(col,1.);}`};
const GFX_FILM={uniforms:{tDiffuse:{value:null},time:{value:0},amount:{value:0},size:{value:1.5}},
  vertexShader:GFX_VS,fragmentShader:`uniform sampler2D tDiffuse;uniform float time,amount,size;varying vec2 vUv;${GFX_HASH}
void main(){vec4 c=texture2D(tDiffuse,vUv);vec2 g=floor(gl_FragCoord.xy/size);float n=(h(g+fract(time*13.7))+h(g*1.31+fract(time*7.3))-1.);
float Y=dot(c.rgb,vec3(.299,.587,.114));c.rgb+=n*amount*.12*(1.-Y*.6);gl_FragColor=c;}`};
// depth of field with a sharp zone: everything between focus-range and focus+range stays sharp, blur grows outside it
const GFX_DOF={uniforms:{tColor:{value:null},tDepth:{value:null},focus:{value:100},range:{value:8},aperture:{value:0.0003},maxblur:{value:0.004},nearClip:{value:1},farClip:{value:1000},aspect:{value:1}},
  vertexShader:GFX_VS,fragmentShader:`#include <packing>
uniform sampler2D tColor,tDepth;uniform float focus,range,aperture,maxblur,nearClip,farClip,aspect;varying vec2 vUv;
float bl(vec2 uv){float z=-perspectiveDepthToViewZ(texture2D(tDepth,uv).x,nearClip,farClip);return clamp((abs(z-focus)-range)*aperture,0.,maxblur);}
void main(){float b=bl(vUv);if(b<=1e-5){gl_FragColor=texture2D(tColor,vUv);return;}
vec4 c=texture2D(tColor,vUv);float w=1.;vec2 ac=vec2(1.,aspect);
for(int i=0;i<24;i++){float fi=float(i)+.5,a=fi*2.39996,r=sqrt(fi/24.);vec2 o=vec2(cos(a),sin(a))*r*b*ac;
float sb=bl(vUv+o);float k=sb>=r*b*.5||sb>=b?1.:.15;c+=texture2D(tColor,vUv+o)*k;w+=k;}
gl_FragColor=c/w;}`};
// ---------------- dust motes ----------------
function gfxDust(){
  const n=1400,pos=new Float32Array(n*3),seed=new Float32Array(n);
  for(let i=0;i<n;i++){pos[i*3]=-80+Math.random()*160;pos[i*3+1]=2+Math.random()*48;pos[i*3+2]=-55+Math.random()*110;seed[i]=Math.random();}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('seed',new THREE.BufferAttribute(seed,1));
  const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{uTime:{value:0},uSize:{value:1},uBright:{value:0.5},uPR:{value:1}},
    vertexShader:`attribute float seed;uniform float uTime,uSize,uPR;varying float vA;
void main(){vec3 p=position;float t=uTime*(.05+seed*.06)+seed*50.;p+=vec3(sin(t*1.3)*5.,sin(t*.7+seed*9.)*3.6-mod(uTime*.006+seed,1.)*6.,cos(t)*4.);
vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=uSize*uPR*(1.5+seed*3.)*(120./-mv.z);
vA=.35+.65*pow(.5+.5*sin(uTime*(.3+seed)+seed*30.),3.);}`,
    fragmentShader:`uniform float uBright;varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,d);gl_FragColor=vec4(vec3(1.,.97,.92)*a*vA*uBright*.5,1.);}`});
  const p=new THREE.Points(g,m);p.name='FX_Dust';p.frustumCulled=false;p.visible=false;p.renderOrder=5;p.userData.noPick=1;return p;}
// ---------------- felt fibres (shell layers, one instanced draw) ----------------
// The pitch cloth gets N stacked see-through layers (an InstancedMesh). Each layer keeps only the fibres still tall
// enough at its height, so they read as short pile. The blend is 2 x src x dst: 0.5 leaves the cloth as it is, darker
// shades the roots, lighter lights the tips, so it works on any field model, its lines and its shadows.
function gfxFeltMesh(n){
  const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,extensions:{derivatives:true},
    blending:THREE.CustomBlending,blendEquation:THREE.AddEquation,blendSrc:THREE.DstColorFactor,blendDst:THREE.SrcColorFactor,blendSrcAlpha:THREE.ZeroFactor,blendDstAlpha:THREE.OneFactor,
    uniforms:{uBase:{value:0.04},uH:{value:0.3},uDen:{value:5},uShade:{value:0.35},uSheen:{value:0.35},uLean:{value:0.35},uFade:{value:1},uSize:{value:new THREE.Vector2(132,88)}},
    vertexShader:`uniform float uBase,uH;varying vec2 vUv;varying float vL,vGraze,vBottom;
void main(){vUv=uv;vec4 w=modelMatrix*instanceMatrix*vec4(position,1.);vL=clamp((instanceMatrix[3].y-uBase)/uH,0.,1.);vBottom=instanceMatrix[3].y<uBase+1e-4?1.:0.;
vec3 v=normalize(cameraPosition-w.xyz);vGraze=pow(1.-abs(v.y),2.);gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`uniform float uDen,uShade,uSheen,uLean,uFade;uniform vec2 uSize;varying vec2 vUv;varying float vL,vGraze,vBottom;${GFX_HASH}
void main(){vec2 g=vUv*uSize*uDen;float px=max(fwidth(g.x),fwidth(g.y));float fade=1.-smoothstep(.25*uFade,.8*uFade,px);
if(vBottom>.5){gl_FragColor=vec4(vec3((1.-uShade*.35)*.5),1.);return;}
if(fade<=0.)discard;vec2 c=floor(g),f=fract(g);float len=.3+.7*h(c+11.3);if(vL>len)discard;
vec2 j=vec2(h(c+3.1),h(c+7.7))*.6+.2;vec2 dir=normalize(vec2(1.,.35)+(vec2(h(c+5.9),h(c+2.3))-.5)*1.4);vec2 lean=dir*uLean*vL*vL*.9;
float t=vL/len,rad=.36*(1.-t*.7);float d=length(f-j-lean);if(d>rad)discard;
float s=mix(1.+uShade*.1,1.+uSheen*(.3+vGraze),t)*(1.-.25*d/rad);gl_FragColor=vec4(vec3(mix(1.,s,fade)*.5),1.);}`});
  const geo=new THREE.PlaneGeometry(132,88);geo.rotateX(-Math.PI/2);
  const im=new THREE.InstancedMesh(geo,m,n);im.name='FX_Felt';im.frustumCulled=false;im.renderOrder=2;im.userData.noPick=1;im.count=n;return im;}
function gfxFeltApply(){const P=GFX.P,L=GFX.L.felt,n=Math.round(clamp(+P.feltLayers||8,2,32));
  if(GFX.felt&&GFX.felt.userData.n!==n){scene.remove(GFX.felt);GFX.felt.geometry.dispose();GFX.felt.material.dispose();GFX.felt=null;}
  if(!GFX.felt){GFX.felt=gfxFeltMesh(n);GFX.felt.userData.n=n;scene.add(GFX.felt);}
  const F=GFX.felt,U=F.material.uniforms,base=0.04,M=new THREE.Matrix4();
  for(let i=0;i<n;i++){M.makeTranslation(0,base+L.height*i/(n-1),0);F.setMatrixAt(i,M);} // layer 0 = the shade between fibresF.instanceMatrix.needsUpdate=true;
  U.uBase.value=base;U.uH.value=L.height;U.uDen.value=L.density;U.uShade.value=L.shade;U.uSheen.value=L.sheen;U.uLean.value=L.lean;U.uFade.value=L.fade;
  F.visible=!!P.felt&&L.height>0;}
// ---------------- cloth detail, texture filtering, line resolution ----------------
// The field textures are 1024 px across the whole pitch (about 8 px per world unit). A tiling felt weave (made here,
// 1024 px per tile) is multiplied over every cloth material in world space, about 110 px per unit at the default
// tile size; mipmaps average it back to neutral far away. Works on every field model without new art.
function gfxClothTex(){
  const N=1024,c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d');
  g.fillStyle='rgb(128,128,128)';g.fillRect(0,0,N,N);const img=g.getImageData(0,0,N,N),d=img.data;
  // two channels: R = matted fibres (short strokes, mixed directions), G = finer fuzz
  const R=new Float32Array(N*N),G=new Float32Array(N*N);
  const stroke=(A,x,y,a,len,v,w)=>{const dx=Math.cos(a),dy=Math.sin(a);for(let t=0;t<len;t+=0.7){const px=Math.round(x+dx*t),py=Math.round(y+dy*t);
    for(let o=-w;o<=w;o++){const qx=((px+Math.round(-dy*o))%N+N)%N,qy=((py+Math.round(dx*o))%N+N)%N;A[qy*N+qx]+=v*(1-Math.abs(o)/(w+1))*(1-Math.abs(t/len-0.5));}}};
  for(let i=0;i<26000;i++){const a=Math.random()<0.6?0.35+(Math.random()-0.5)*0.9:Math.random()*Math.PI*2;stroke(R,Math.random()*N,Math.random()*N,a,6+Math.random()*16,(Math.random()<0.5?-1:1)*(0.35+Math.random()*0.5),Math.random()<0.3?1:0);}
  for(let i=0;i<60000;i++){stroke(G,Math.random()*N,Math.random()*N,Math.random()*Math.PI*2,2+Math.random()*5,(Math.random()<0.5?-1:1)*(0.4+Math.random()*0.6),0);}
  const norm=A=>{let m=0;for(let i=0;i<A.length;i++)m+=A[i];m/=A.length;let v=0;for(let i=0;i<A.length;i++){A[i]-=m;v+=A[i]*A[i];}v=Math.sqrt(v/A.length)||1;for(let i=0;i<A.length;i++)A[i]=Math.max(-1,Math.min(1,A[i]/v/2.5));};
  norm(R);norm(G);for(let i=0;i<N*N;i++){d[i*4]=128+R[i]*127;d[i*4+1]=128+G[i]*127;d[i*4+2]=128;d[i*4+3]=255;}
  g.putImageData(img,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;}
const GFX_CLOTH_U={tClothDetail:{value:null},uClothScale:{value:9},uClothAmt:{value:0.35},uClothFine:{value:0.45},uClothRough:{value:0.12}};
function gfxIsCloth(o,m){if(o===cloth)return true;if(m&&/^Field_/i.test(m.name||'')&&!/surround/i.test(m.name))return true;for(let n=o;n;n=n.parent)if(/_Cloth$/i.test(n.name||''))return true;return false;}
// Cloth detail follows the mesh UVs (19 Nov 2026, was a world top-down projection): world size of one UV unit, from
// the first triangle with usable UVs, so the weave keeps its real size whatever the UV layout. No UVs: the old projection.
function gfxClothTile(o){const g=o.geometry,P=g&&g.attributes.position,U=g&&g.attributes.uv;if(!P||!U)return null;o.updateMatrixWorld(true);
  const ix=g.index,n=ix?ix.count:P.count,v=[0,1,2].map(()=>new THREE.Vector3()),t=[0,1,2].map(()=>new THREE.Vector2());
  for(let f=0;f+2<n&&f<3000;f+=3){for(let i=0;i<3;i++){const k=ix?ix.getX(f+i):f+i;v[i].fromBufferAttribute(P,k).applyMatrix4(o.matrixWorld);t[i].fromBufferAttribute(U,k);}
    const e1=v[1].clone().sub(v[0]),e2=v[2].clone().sub(v[0]),a=t[1].clone().sub(t[0]),b=t[2].clone().sub(t[0]),det=a.x*b.y-a.y*b.x;if(Math.abs(det)<1e-9)continue;
    const T=e1.clone().multiplyScalar(b.y).addScaledVector(e2,-a.y).divideScalar(det),B=e2.clone().multiplyScalar(a.x).addScaledVector(e1,-b.x).divideScalar(det);
    if(T.length()>1e-6&&B.length()>1e-6)return new THREE.Vector2(T.length(),B.length());}return null;}
function gfxClothPatch(m,o){if(m.userData.gfxCloth)return;m.userData.gfxCloth=1;
  const tile=o?gfxClothTile(o):null;m.userData.clothTile={value:tile||new THREE.Vector2(1,1)};m.userData.clothUV={value:tile?1:0};
  const prev=m.onBeforeCompile,pk=m.customProgramCacheKey;
  m.onBeforeCompile=function(sh,r){if(prev)prev.call(this,sh,r);Object.assign(sh.uniforms,GFX_CLOTH_U);sh.uniforms.uClothTile=m.userData.clothTile;sh.uniforms.uClothUV=m.userData.clothUV;
    sh.vertexShader='varying vec2 vClothW;uniform vec2 uClothTile;uniform float uClothUV;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvClothW=uClothUV>.5?uv*uClothTile:(modelMatrix*vec4(transformed,1.)).xz;');
    sh.fragmentShader='uniform sampler2D tClothDetail;uniform float uClothScale,uClothAmt,uClothFine,uClothRough;varying vec2 vClothW;\n'+sh.fragmentShader
      .replace('#include <map_fragment>','#include <map_fragment>\nvec2 cuv=vClothW/uClothScale;vec2 cd=vec2(texture2D(tClothDetail,cuv).r,texture2D(tClothDetail,cuv*2.73+vec2(.37,.61)).g)-.5;float cdet=mix(cd.x,cd.y,uClothFine);diffuseColor.rgb*=1.+cdet*2.*uClothAmt;')
      .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor-cdet*uClothRough*2.,0.,1.);');};
  m.customProgramCacheKey=function(){return (pk?pk.call(this):'')+'|gfxcloth2';};m.needsUpdate=true;}
// every second (cheap): new materials from a field / table change get the detail and the filtering
function gfxTexScan(){const P=GFX.P;if(!P)return;const an=Math.min(+P.aniso||1,renderer.capabilities.getMaxAnisotropy());
  scene.traverse(o=>{if(!o.isMesh||!o.material)return;[].concat(o.material).forEach(m=>{
    if(m.map&&m.map.anisotropy!==an&&!m.map.isCanvasTexture){m.map.anisotropy=an;m.map.needsUpdate=true;}
    if(gfxIsCloth(o,m))gfxClothPatch(m,o);});});}
function gfxClothApply(){const P=GFX.P,L=GFX.L.cloth;if(!GFX_CLOTH_U.tClothDetail.value)GFX_CLOTH_U.tClothDetail.value=gfxClothTex();
  GFX_CLOTH_U.uClothAmt.value=P.clothDetail?L.amount:0;GFX_CLOTH_U.uClothScale.value=L.scale;GFX_CLOTH_U.uClothFine.value=L.fine;GFX_CLOTH_U.uClothRough.value=P.clothDetail?L.rough:0;
  const w=+P.linesRes||2048;if((window.PITCH_W||2048)!==w&&typeof redrawLines==='function'){window.PITCH_W=w;redrawLines();}
  GFX.texT=0;}
// ---------------- felt dust puffs ----------------
const PUFF_N=320;
function gfxPuffMesh(){
  const g=new THREE.BufferGeometry(),pos=new Float32Array(PUFF_N*3),dat=new Float32Array(PUFF_N*4);
  const vel=new Float32Array(PUFF_N*3);
  g.setAttribute('position',new THREE.BufferAttribute(pos,3).setUsage(THREE.DynamicDrawUsage));g.setAttribute('pdat',new THREE.BufferAttribute(dat,4).setUsage(THREE.DynamicDrawUsage));g.setAttribute('pvel',new THREE.BufferAttribute(vel,3).setUsage(THREE.DynamicDrawUsage));
  // Fibres: each particle is a short green streak drawn along its screen-space motion (like turf kicked up). Dust: soft clouds.
  const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uPR:{value:1},uSize:{value:1},uOp:{value:0.45},uCol:{value:new THREE.Color(0.2,0.42,0.16)},uFib:{value:1}},
    vertexShader:`attribute vec4 pdat;attribute vec3 pvel;uniform float uPR,uSize,uFib;varying float vA,vS;varying vec2 vDir;
void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;float a=pdat.x;
vec4 q=projectionMatrix*(mv+viewMatrix*vec4(pvel*.05,0.));vec2 sd=q.xy/q.w-gl_Position.xy/gl_Position.w;sd.y=-sd.y;vDir=length(sd)>1e-6?normalize(sd):vec2(1.,0.);
vA=pdat.w*(a<.08?a/.08:1.)*pow(max(1.-a,0.),uFib>.5?.8:1.6);vS=pdat.z;
gl_PointSize=pdat.w>0.?uSize*uPR*pdat.y*(uFib>.5?1.:1.+a*1.6)*(300./-mv.z):0.;}`,
    fragmentShader:`uniform float uOp,uFib;uniform vec3 uCol;varying float vA,vS;varying vec2 vDir;${GFX_HASH}
void main(){vec2 p=gl_PointCoord-.5;float a;vec3 col=uCol;
if(uFib>.5){float t=clamp(dot(p,vDir),-.45,.45);float d=length(p-vDir*t);a=smoothstep(.12,.04,d)*(.55+.45*(t/.9+.5))*vA*uOp*1.8;col*=(.7+.5*h(vec2(vS*17.,3.)))*(.8+.5*(t/.9+.5));}
else{float d=length(p);float n=h(floor(gl_PointCoord*6.)+vS*31.)*.35;a=smoothstep(.5,.05,d+n*.3)*vA*uOp;}
if(a<.003)discard;gl_FragColor=vec4(col,min(a,1.));}`});
  const pts=new THREE.Points(g,m);pts.name='FX_Puffs';pts.frustumCulled=false;pts.renderOrder=6;pts.userData.noPick=1;
  return {pts,pos,dat,vel,age:new Float32Array(PUFF_N),life:new Float32Array(PUFF_N),next:0,prev:[],acc:new Float32Array(21)};}
function gfxPuffEmit(x,z,vx,vz,size,n){const P=GFX.puff,L=GFX.L.puff;
  for(let k=0;k<n;k++){const i=P.next;P.next=(P.next+1)%PUFF_N;
    P.pos[i*3]=x+(Math.random()-.5)*0.8;P.pos[i*3+1]=0.25+Math.random()*0.3;P.pos[i*3+2]=z+(Math.random()-.5)*0.8;
    const fib=L.style!=='Dust',a=Math.random()*6.2832,sp=fib?5+Math.random()*9:1+Math.random()*2.5;P.vel[i*3]=vx*(fib?2.5:1)+Math.cos(a)*sp;P.vel[i*3+1]=fib?2+Math.random()*4:1.2+Math.random()*1.8;P.vel[i*3+2]=vz*(fib?2.5:1)+Math.sin(a)*sp;
    P.age[i]=0;P.life[i]=L.life*(0.7+Math.random()*0.6);P.dat[i*4]=0;P.dat[i*4+1]=size*(0.7+Math.random()*0.6);P.dat[i*4+2]=Math.random();P.dat[i*4+3]=1;}}
// every frame: watch the figures and the ball; skating leaves a trail, a hard stop or start kicks up a burst
function gfxPuffTick(dt){
  const on=!!(GFX.P&&GFX.P.puffs)&&!SET.calm&&GFX.L.puff.amount>0;
  if(!GFX.puff){if(!on)return;GFX.puff=gfxPuffMesh();scene.add(GFX.puff.pts);}
  const P=GFX.puff,L=GFX.L.puff;P.pts.visible=on;if(!on)return;
  dt=Math.min(dt||0.016,0.05);const A=L.amount;
  if(dt>0)for(let i=0;i<=20;i++){const b=i<20?bodies[i]:ball;if(!b||b.off){P.prev[i]=null;continue;}
    const q=P.prev[i];P.prev[i]={x:b.x,z:b.z,s:q?q.s:0};if(!q)continue;
    const dx=b.x-q.x,dz=b.z-q.z,d=Math.hypot(dx,dz),s=d/dt,ps=q.s;P.prev[i].s=s;if(d>8){P.prev[i].s=0;continue;} // a jump (reset, replay): no puff
    const isB=i===20,mul=isB?L.ball:1,r=isB?RB:RF;if(mul<=0)continue;
    const ux=d>1e-5?dx/d:0,uz=d>1e-5?dz/d:0;
    const grounded=!isB||(b.hy||RB)<RB+0.4;
    if(s>6&&grounded){P.acc[i]+=Math.min(40,(s-6)*0.35)*A*mul*dt;
      while(P.acc[i]>=1){P.acc[i]-=1;gfxPuffEmit(b.x-ux*r*0.9,b.z-uz*r*0.9,-ux*s*0.04,-uz*s*0.04,isB?0.7:1,1);}}
    if(ps>14&&s<1.5)gfxPuffEmit(b.x,b.z,0,0,isB?0.8:1.3,Math.round(9*A*mul));
    else if(ps<1&&s>25)gfxPuffEmit(b.x-ux*r,b.z-uz*r,-ux*3,-uz*3,isB?0.8:1.2,Math.round(6*A*mul));}
  let alive=0;for(let i=0;i<PUFF_N;i++){if(P.dat[i*4+3]<=0)continue;P.age[i]+=dt;const a=P.age[i]/P.life[i];
    if(a>=1){P.dat[i*4+3]=0;continue;}alive++;const fib=L.style!=='Dust',k=Math.exp(-dt*(fib?2.2:3));P.vel[i*3]*=k;P.vel[i*3+2]*=k;P.vel[i*3+1]=fib?P.vel[i*3+1]-dt*28:P.vel[i*3+1]*Math.exp(-dt*2)-dt*0.4;
    if(fib&&P.pos[i*3+1]<=0.16&&P.vel[i*3+1]<0){P.vel[i*3+1]=0;P.vel[i*3]*=0.6;P.vel[i*3+2]*=0.6;}
    P.pos[i*3]+=P.vel[i*3]*dt;P.pos[i*3+1]=Math.max(0.15,P.pos[i*3+1]+P.vel[i*3+1]*dt);P.pos[i*3+2]+=P.vel[i*3+2]*dt;P.dat[i*4]=a;}
  P.pts.geometry.attributes.position.needsUpdate=true;P.pts.geometry.attributes.pdat.needsUpdate=true;P.pts.geometry.attributes.pvel.needsUpdate=true;
  const U=P.pts.material.uniforms;U.uPR.value=renderer.getPixelRatio();U.uSize.value=L.size;U.uOp.value=L.opacity;
  U.uFib.value=L.style!=='Dust'?1:0;U.uCol.value.setRGB(0.86+(0.13-0.86)*L.tint,0.87+(0.45-0.87)*L.tint,0.8+(0.08-0.8)*L.tint);}
// ---------------- the post chain ----------------
// dust, felt and puffs stay out of the normals/depth and reflection draws; returns the function that shows them again
function gfxHideFx(){const L=[GFX.dust,GFX.felt,GFX.puff&&GFX.puff.pts].filter(o=>o&&o.visible);L.forEach(o=>o.visible=false);return ()=>L.forEach(o=>o.visible=true);}
function gfxHalfFloat(){const r=renderer;return !!(r.capabilities.isWebGL2&&(r.extensions.has('EXT_color_buffer_float')||r.extensions.has('EXT_color_buffer_half_float')));}
function gfxDispose(){const B=GFX.built;if(!B)return;try{B.composer.renderTarget1.dispose();B.composer.renderTarget2.dispose();B.gRT.dispose();B.aoRT.dispose();
  B.composer.passes.forEach(p=>{try{p.dispose&&p.dispose();}catch(e){}});B.aoMat.dispose();}catch(e){}GFX.built=null;}
function gfxBuild(){
  gfxDispose();const R=renderer,P=GFX.P;
  if(!THREE.EffectComposer)throw new Error('lib/three-post.js is missing');
  const ms=P.aa==='MSAA 4x'&&R.capabilities.isWebGL2,half=gfxHalfFloat();
  const opt={minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat,type:half?THREE.HalfFloatType:THREE.UnsignedByteType};
  const rt=ms?new THREE.WebGLMultisampleRenderTarget(4,4,opt):new THREE.WebGLRenderTarget(4,4,opt);if(ms)rt.samples=4;
  const composer=new THREE.EffectComposer(R,rt);
  // normals + depth, shared by AO, bounce light and depth of field (one extra draw of the scene)
  const dt=new THREE.DepthTexture();dt.type=THREE.UnsignedIntType;dt.minFilter=dt.magFilter=THREE.NearestFilter;
  const gRT=new THREE.WebGLRenderTarget(4,4,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,format:THREE.RGBAFormat,depthTexture:dt,depthBuffer:true});
  const nMat=new THREE.MeshNormalMaterial();
  const B={composer,gRT,nMat,ms,half,need:false,lite:false};
  const pass=fn=>{const p=new THREE.Pass();p.render=fn;return p;};
  B.gbuf=pass(function(r){if(!B.need)return;const ov=scene.overrideMaterial,bg=scene.background,hid=gfxHideFx();
    scene.overrideMaterial=nMat;scene.background=null;
    const oc=r.getClearColor(new THREE.Color()),oa=r.getClearAlpha();r.setClearColor(0x7f7fff,1);r.setRenderTarget(gRT);r.clear();r.render(scene,camera);
    r.setClearColor(oc,oa);scene.overrideMaterial=ov;scene.background=bg;hid();});
  B.gbuf.needsSwap=false;
  B.render=new THREE.RenderPass(scene,camera);
  B.ssr=new THREE.SSRPass({renderer:R,scene,camera,width:4,height:4,selects:[],encoding:THREE.LinearEncoding});
  try{B.ssr.beautyRenderTarget.texture.type=opt.type;}catch(e){}
  B.ssr.enabled=false;{const r0=B.ssr.render.bind(B.ssr);B.ssr.render=function(...a){const hid=gfxHideFx();try{r0(...a);}finally{hid();}};}
  B.aoMat=gfxAoMat(8);B.aoN=8;
  B.aoRT=new THREE.WebGLRenderTarget(4,4,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat});
  B.aoQuad=new THREE.FullScreenQuad(B.aoMat);
  B.aoBlur=new THREE.ShaderMaterial(GFX_AOBLUR);B.aoBlur.uniforms=THREE.UniformsUtils.clone(GFX_AOBLUR.uniforms);B.blurQuad=new THREE.FullScreenQuad(B.aoBlur);
  B.ao=pass(function(r,w,rd){const U=B.aoMat.uniforms;U.tDepth.value=dt;U.tNormal.value=gRT.texture;U.proj.value.copy(camera.projectionMatrix);U.invProj.value.copy(camera.projectionMatrixInverse);
    U.near.value=camera.near;U.far.value=camera.far;U.radius.value=GFX.L.ao.radius;U.time.value=(performance.now()/1000)%100;U.res.value.set(B.aoRT.width,B.aoRT.height);
    r.setRenderTarget(B.aoRT);B.aoQuad.render(r);
    const V=B.aoBlur.uniforms;V.tAo.value=B.aoRT.texture;V.tDepth.value=dt;V.tDiffuse.value=rd.texture;V.near.value=camera.near;V.far.value=camera.far;V.res.value.set(B.aoRT.width,B.aoRT.height);V.intensity.value=GFX.L.ao.intensity;
    r.setRenderTarget(this.renderToScreen?null:w);B.blurQuad.render(r);});
  B.ssgi=new THREE.ShaderPass(GFX_SSGI);
  B.dof=new THREE.ShaderPass(GFX_DOF,'tColor');
  B.bloom=new THREE.UnrealBloomPass(new THREE.Vector2(4,4),0.25,0.4,1);
  B.out=new THREE.ShaderPass(GFX_OUT);
  B.lens=new THREE.ShaderPass(GFX_LENS);
  B.film=new THREE.ShaderPass(GFX_FILM);
  B.fxaa=new THREE.ShaderPass(THREE.FXAAShader);
  B.smaa=new THREE.SMAAPass(4,4);
  [B.gbuf,B.render,B.ssr,B.ao,B.ssgi,B.dof,B.bloom,B.out,B.lens,B.fxaa,B.smaa,B.film].forEach(p=>composer.addPass(p));
  GFX.built=B;gfxSize();return B;}
function gfxSize(){const B=GFX.built;if(!B)return;const R=renderer,v=R.getDrawingBufferSize(new THREE.Vector2()),W=Math.max(1,v.x),H=Math.max(1,v.y),P=GFX.P;
  B.composer.setPixelRatio(1);B.composer.setSize(W,H);B.gRT.setSize(W,H);
  const a=P.ssaoQ>=3?1:0.5;B.aoRT.setSize(Math.max(1,Math.round(W*a)),Math.max(1,Math.round(H*a)));
  if(P.bloomQ<2)B.bloom.setSize(Math.round(W/2),Math.round(H/2));
  const q=[0,0.5,0.75,1][P.ssrQ]||0.5;B.ssr.setSize(Math.round(W*q),Math.round(H*q));
  B.fxaa.uniforms.resolution.value.set(1/W,1/H);B.ssgi.uniforms.resolution.value.set(W,H);B.lens.uniforms.resolution.value.set(W,H);
  B.dof.uniforms.aspect.value=W/H;B.W=W;B.H=H;}
// which surfaces reflect: glossy enough (roughness at most look.ssr.maxRough)
function gfxSsrSelects(){const B=GFX.built;if(!B)return;const lim=GFX.L.ssr.maxRough,sel=[];
  scene.traverse(o=>{if(!o.isMesh||!o.visible)return;const m=Array.isArray(o.material)?o.material[0]:o.material;if(m&&m.roughness!=null&&m.roughness<=lim&&!m.transparent)sel.push(o);});
  B.ssr.selects=sel;B.ssr.selective=true;B.ssrT=performance.now();}
// how strong the cinematic depth of field is now: title screen, kick-off fly-in, a goal
function gfxCineK(now){let k=0;
  if(typeof TITLE!=='undefined'){if(TITLE.on)k=1;else if(TITLE.leaving){const d=TITLE.dur||1300;k=Math.max(0,1-(now-TITLE.leaving)/d);}}
  if(GFX.cine){const t=(now-GFX.cine)/1000;if(t<2.6)k=Math.max(k,t<0.25?t/0.25:t>2?1-(t-2)/0.6:1);else GFX.cine=0;}
  return k;}
function gfxCine(focus){GFX.cine=performance.now();GFX.cineFocus=focus||null;}
const GFX_V=new THREE.Vector3();
// view depth (distance along the camera's look) of a point on the table
function gfxDepth(x,y,z){GFX_V.set(x,y,z).applyMatrix4(camera.matrixWorldInverse);return -GFX_V.z;}
// the focus and the sharp zone right now: [focus, half depth of the zone], before smoothing
function gfxFocusRaw(){const L=GFX.L.dof,t=L.target;
  if(typeof TITLE!=='undefined'&&(TITLE.on||TITLE.leaving))return [gfxDepth(0,0,0),L.range];
  if(t==='Fixed distance')return [L.focus,L.range];
  if(t==='Camera target'&&typeof cam!=='undefined'&&cam.look)return [gfxDepth(cam.look.x,0,cam.look.z),L.range];
  const fig=typeof sel!=='undefined'&&sel>=0?sel:typeof aimShow!=='undefined'&&aimShow&&aimShow.fig>=0?aimShow.fig:-1;
  const bz=gfxDepth(ball.x,ball.hy||1,ball.z),useFig=fig>=0&&bodies[fig]&&!(GFX.cine&&GFX.cineFocus==='ball');
  if(t==='Ball'||!useFig)return [bz,L.range];
  const fz=gfxDepth(bodies[fig].x,1.5,bodies[fig].z);
  if(t==='Selected player')return [fz,L.range];
  return [(bz+fz)/2,Math.abs(bz-fz)/2+L.range];}
function gfxFocus(dt){const f=gfxFocusRaw(),k=GFX.focusS?1-Math.exp(-(dt||0.016)*GFX.L.dof.speed):1;
  GFX.focusS=GFX.focusS||f.slice();GFX.focusS[0]+=(f[0]-GFX.focusS[0])*k;GFX.focusS[1]+=(f[1]-GFX.focusS[1])*k;return GFX.focusS;}
// set every pass from the effective preset and the look (cheap: call on every change)
function gfxPasses(){const B=GFX.built;if(!B)return;const P=GFX.P,L=GFX.L,lite=B.lite;
  const ssr=P.ssr&&!lite,ao=P.ssao&&!lite,gi=P.ssgi&&!lite;
  B.render.enabled=!ssr;B.ssr.enabled=ssr;
  if(ssr){B.ssr.opacity=L.ssr.intensity;B.ssr.maxDistance=L.ssr.distance;B.ssr.thickness=0.6;B.ssr.blur=P.ssrQ<3;B.ssr.fresnel=true;B.ssr.distanceAttenuation=true;if(!B.ssrT||performance.now()-B.ssrT>2000)gfxSsrSelects();}
  const n=P.ssaoQ>=2?16:8;if(n!==B.aoN){B.aoMat.dispose();B.aoMat=gfxAoMat(n);B.aoQuad.material=B.aoMat;B.aoN=n;}
  B.ao.enabled=ao&&L.ao.intensity>0;
  B.ssgi.enabled=gi&&L.ssgi.intensity>0;const G=B.ssgi.uniforms;G.intensity.value=L.ssgi.intensity;G.radius.value=L.ssgi.radius;
  B.bloom.enabled=P.bloom&&L.bloom.strength>0;B.bloom.strength=L.bloom.strength;B.bloom.radius=L.bloom.radius;B.bloom.threshold=L.bloom.threshold;
  const O=B.out.uniforms,A=L.agx,Gr=L.grade;O.tone.value=Math.max(0,GFX_TONES.indexOf(L.tone));
  O.agxContrast.value=A.contrast;O.agxToe.value=A.toe;O.agxShoulder.value=A.shoulder;O.agxPivot.value=A.pivot;O.agxMid.value=A.mid;O.agxSat.value=A.saturation;O.agxSlope.value=A.slope;O.agxOffset.value=A.offset;O.agxPower.value=A.power;
  O.sat.value=Gr.saturation;O.con.value=Gr.contrast;O.temp.value=Gr.temperature;O.tint.value=Gr.tint;O.lift.value=Gr.lift;O.gain.value=Gr.gain;
  const Ln=L.lens,V=L.vhs,U=B.lens.uniforms,on=P.lens;
  U.ca.value=on?Ln.ca:0;U.vignette.value=on?Ln.vignette:0;U.vignetteSoft.value=Ln.vignetteSoft;U.softness.value=on?Ln.softness:0;
  U.vTrack.value=on?V.tracking:0;U.vBleed.value=on?V.bleed:0;U.vDesat.value=on?V.desat:0;U.vTint.value=on?V.tint:0;U.vLift.value=on?V.lift:0;U.vScan.value=on?V.scanlines:0;U.vNoise.value=on?V.noise:0;
  B.lens.enabled=on;B.film.enabled=on&&Ln.grain>0;B.film.uniforms.amount.value=Ln.grain;B.film.uniforms.size.value=Ln.grainSize;
  B.fxaa.enabled=P.aa==='FXAA';B.smaa.enabled=P.aa==='SMAA';}
// ---------------- apply ----------------
function gfxToneSync(){const P=GFX.P,want=P&&P.post&&!GFX.broken?THREE.NoToneMapping:({ACES:THREE.ACESFilmicToneMapping,Reinhard:THREE.ReinhardToneMapping,Cineon:THREE.CineonToneMapping,Linear:THREE.LinearToneMapping,None:THREE.NoToneMapping})[GFX.L&&GFX.L.tone]??THREE.ACESFilmicToneMapping;
  if(renderer.toneMapping!==want){renderer.toneMapping=want;scene.traverse(o=>{if(o.material)[].concat(o.material).forEach(m=>{m.needsUpdate=true;});});}}
function gfxShadows(){const P=GFX.P,sig=[P.shadows,P.shadowRes,P.shadowSoft].join();if(sig===GFX.shadowSig)return;GFX.shadowSig=sig;
  const R=renderer,type=P.shadowSoft?THREE.PCFSoftShadowMap:THREE.PCFShadowMap,sz=+P.shadowRes||2048;
  R.shadowMap.enabled=!!P.shadows;R.shadowMap.type=type;sun.castShadow=!!P.shadows;
  if(sun.shadow.mapSize.x!==sz){sun.shadow.mapSize.set(sz,sz);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}}
  scene.traverse(o=>{if(o.material)[].concat(o.material).forEach(m=>{m.needsUpdate=true;});});}
function gfxApply(){
  const old=GFX.P;gfxEffective();const P=GFX.P;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,P.dpr)*P.scale/100);
  gfxShadows();
  if(!GFX.dust){GFX.dust=gfxDust();scene.add(GFX.dust);}
  const D=GFX.L.dust;GFX.dust.visible=!!P.dust&&D.amount>0;GFX.dust.geometry.setDrawRange(0,Math.round(1400*Math.min(1,D.amount)));
  GFX.dust.material.uniforms.uSize.value=D.size;GFX.dust.material.uniforms.uBright.value=D.brightness;
  gfxFeltApply();gfxClothApply();
  if(P.post&&!GFX.broken){try{if(!GFX.built||(P.aa==='MSAA 4x')!==GFX.built.ms)gfxBuild();gfxPasses();}catch(e){gfxFail(e);}}
  else if(GFX.built&&old&&old.post!==P.post)gfxDispose();
  gfxToneSync();resize();
  if(typeof gfxUiSync==='function')gfxUiSync();}
function gfxFail(e){if(!GFX.warned)console.error('[graphics] post effects switched off:',e);GFX.warned=true;GFX.broken=true;gfxDispose();gfxToneSync();}
// the table, every frame (js/loop.js): straight, or through the post chain
function gfxRender(dt){
  const now=performance.now(),P=GFX.P||gfxEffective();
  try{gfxPuffTick(dt);}catch(e){if(!GFX.puffWarn)console.warn('[graphics] puffs',e);GFX.puffWarn=1;}
  if(now-(GFX.texT||0)>1000){GFX.texT=now;try{gfxTexScan();}catch(e){}}
  if(P.fps>0&&now-GFX.lastDraw<1000/P.fps-2)return;GFX.lastDraw=now;
  if(GFX.dust&&GFX.dust.visible){const U=GFX.dust.material.uniforms;U.uTime.value=(now/1000)%1000;U.uPR.value=renderer.getPixelRatio();}
  if(!P.post||GFX.broken||!GFX.built){const x=renderer.toneMappingExposure;renderer.toneMappingExposure=x*(GFX.L?GFX.L.exposure:1);renderer.render(scene,camera);renderer.toneMappingExposure=x;return;}
  try{const B=GFX.built,L=GFX.L;
    const lite=!!(window.DISTAL&&DISTAL.active&&DISTAL.active!=='match');if(lite!==B.lite){B.lite=lite;gfxPasses();}
    if(B.ssr.enabled&&now-B.ssrT>2000)gfxSsrSelects();
    const k=P.dof==='Always'?1:P.dof==='Cinematic'?gfxCineK(now):0;
    B.dof.enabled=!lite&&k>0.01&&L.dof.aperture>0;
    if(B.dof.enabled){const U=B.dof.uniforms,F=gfxFocus(dt);U.tDepth.value=B.gRT.depthTexture;U.focus.value=F[0];U.range.value=F[1];U.aperture.value=L.dof.aperture*0.0001*k;U.maxblur.value=L.dof.maxblur*0.002*k;U.nearClip.value=camera.near;U.farClip.value=camera.far;}else GFX.focusS=null;
    B.need=B.ao.enabled||B.ssgi.enabled||B.dof.enabled;
    if(B.ssgi.enabled){const G=B.ssgi.uniforms;G.tDepth.value=B.gRT.depthTexture;G.tNormal.value=B.gRT.texture;G.cameraNear.value=camera.near;G.cameraFar.value=camera.far;G.time.value=(now/1000)%100;}
    B.out.uniforms.exposure.value=renderer.toneMappingExposure*L.exposure;
    const t=(now/1000)%100;B.lens.uniforms.time.value=t;B.film.uniforms.time.value=t;
    B.composer.render(dt);
  }catch(e){gfxFail(e);renderer.render(scene,camera);}}
// ---------------- hooks into the game ----------------
{const baseResize=resize;resize=function(){baseResize();gfxSize();};window.addEventListener('resize',()=>gfxSize());}
applyGraphics=function(){gfxApply();document.body.classList.toggle('calm',!!SET.calm);};
// the scene's own tone mapping (Scene > Environment) gives way to the Graphics look; exposure is kept and multiplied
{const baseScene=applySceneData;applySceneData=function(prev){const r=baseScene(prev);try{gfxToneSync();}catch(e){}return r;};}
{const baseGoal=scoreGoal;scoreGoal=function(){try{gfxCine('ball');}catch(e){}return baseGoal.apply(this,arguments);};}
onDataFile('graphics',o=>{GFX.data=gfxClean(o);gfxApply();});
// ---------------- Settings > Graphics ----------------
// the Graphics box scrolls inside the settings frame (many rows); ui.js scrolls the focused control into view
function gfxUiCss(){if(document.getElementById('gfx-css'))return;const st=document.createElement('style');st.id='gfx-css';
  st.textContent='[data-panel=settings] .set-grid.sub-one>.col{height:100%;min-height:0;display:flex;flex-direction:column}'+
    '[data-panel=settings] .cardbox[data-sub="gfx"]{max-height:100%;min-height:0;box-sizing:border-box;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:var(--mus,#e8b13a) rgba(0,0,0,.25);padding-right:10px}'+
    '[data-panel=settings] .cardbox[data-sub="gfx"]{overflow-x:hidden}'+
    '[data-panel=settings] .cardbox[data-sub="gfx"] .srow{margin-right:-10px;grid-template-columns:minmax(110px,1fr) minmax(0,max-content)}'+
    '[data-panel=settings] .cardbox[data-sub="gfx"] .srow>label,[data-panel=settings] .cardbox[data-sub="gfx"] .srow>.sl{min-width:0;overflow-wrap:anywhere}'+
    '[data-panel=settings] .cardbox[data-sub="gfx"] .srow>.seg{justify-content:flex-end;min-width:0}'+
    '[data-panel=settings] .cardbox[data-sub="gfx"] .srow>.rng{min-width:0;width:400px;max-width:100%;justify-content:flex-end}'+
    '[data-panel=settings] .cardbox[data-sub="gfx"] .srow>.rng input[type=range]{width:auto;flex:1 1 340px;max-width:340px;min-width:80px}'+
    '[data-panel=settings] .cardbox[data-sub="gfx"]>.h:first-child{position:sticky;top:-12px;z-index:2;margin:-12px -10px 10px -16px!important;padding:12px 10px 8px 16px!important;background:var(--grain,none),rgba(15,34,64,.97)!important}';
  document.head.appendChild(st);}
function gfxUiBuild(){
  gfxUiCss();const box=document.querySelector('.cardbox[data-sub="gfx"]');if(!box)return;
  ['gfx-preset','gfx-scale','gfx-shadows'].forEach(id=>{const e=document.getElementById(id);const row=e&&e.closest('.srow');if(row)row.remove();});
  let w=document.getElementById('gfx-rows');if(!w){w=document.createElement('div');w.id='gfx-rows';const h=box.querySelector('.h');h.after(w);}
  const D=GFX.data,pl=gfxPlayer(),P=GFX.P||gfxEffective(),list=GFX_PRESETS.filter(p=>p!=='deck'||GFX.deck||D.expose.deckPreset);
  const cur=pl.p==='auto'?'auto':pl.p,custom=Object.keys(pl.o).some(k=>D.expose[k]);
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  let h=`<div class="srow" title="Sets every graphics option at once. Auto picks one for this device."><span class="sl">Quality</span><div class="seg" id="gfx-q">`+
    `<button class="chip" data-gq="auto" aria-pressed="${cur==='auto'}">Auto</button>`+list.map(p=>`<button class="chip" data-gq="${p}" aria-pressed="${cur===p}">${GFX_PNAME[p]}</button>`).join('')+`</div></div>`;
  h+=`<p class="note" id="gfx-note" style="margin:2px 0 6px">${esc((cur==='auto'?'Auto: ':'')+GFX_PNAME[GFX.preset]+(custom?' with your changes':''))}</p>`;
  GFX_PCAT.forEach(([k,lab,help,type,a,b,st])=>{if(!D.expose[k])return;const v=P[k],id='gfxo-'+k,t=help?` title="${esc(help)}"`:'';
    if(type==='toggle')h+=`<div class="srow"${t}><label for="${id}">${esc(lab)}</label><span class="tog"><input type="checkbox" id="${id}" data-gk="${k}" ${v?'checked':''}><i></i></span></div>`;
    else if(type==='range')h+=`<div class="srow"${t}><label for="${id}">${esc(lab)}</label><div class="rng"><input type="range" id="${id}" data-gk="${k}" min="${a}" max="${b}" step="${st}" value="${v}"><output>${k==='scale'?v+'%':v}</output></div></div>`;
    else h+=`<div class="srow"${t}><span class="sl">${esc(lab)}</span><div class="seg">${a.map(o=>`<button class="chip" data-gk="${k}" data-gv="${esc(o)}" aria-pressed="${String(o)===String(v)}">${esc(k==='fps'?(o?o:'Off'):o)}</button>`).join('')}</div></div>`;});
  if(Object.keys(pl.o).length)h+=`<div class="srow"><span class="sl"></span><button class="chip" id="gfx-reset" type="button">Reset to ${esc(GFX_PNAME[GFX.preset])}</button></div>`;
  w.innerHTML=h;}
function gfxSet(k,v){const pl=gfxPlayer();const def=gfxGet(GFX.data.presets,(GFX.force||(pl.p==='auto'?gfxAuto():pl.p))+'.'+k);
  if(String(def)===String(v))delete pl.o[k];else pl.o[k]=v;saveSet();gfxApply();}
function gfxUiSync(){if(document.getElementById('gfx-rows')&&!GFX.uiLock)gfxUiBuild();}
document.addEventListener('click',e=>{const q=e.target.closest('#gfx-rows [data-gq]');if(q){const pl=gfxPlayer();pl.p=q.dataset.gq;pl.o={};saveSet();gfxApply();return;}
  const c=e.target.closest('#gfx-rows .chip[data-gk]');if(c){const k=c.dataset.gk,cat=GFX_PCAT.find(x=>x[0]===k);let v=c.dataset.gv;if(cat&&typeof cat[4][0]==='number')v=+v;gfxSet(k,v);return;}
  if(e.target.closest('#gfx-reset')){gfxPlayer().o={};saveSet();gfxApply();}});
document.addEventListener('change',e=>{const i=e.target.closest('#gfx-rows input[data-gk]');if(!i)return;gfxSet(i.dataset.gk,i.type==='checkbox'?i.checked:+i.value);});
document.addEventListener('input',e=>{const i=e.target.closest('#gfx-rows input[type=range][data-gk]');if(!i)return;const o=i.parentNode.querySelector('output');if(o)o.textContent=i.dataset.gk==='scale'?i.value+'%':i.value;});
// ---------------- Distal ----------------
function gfxMeta(){return {pcat:GFX_PCAT,lcat:GFX_LCAT,tones:GFX_TONES,presets:GFX_PRESETS,names:GFX_PNAME,def:JSON.parse(JSON.stringify(GFX_DEF)),data:JSON.parse(JSON.stringify(GFX.data)),
  active:GFX.preset,force:GFX.force,broken:GFX.broken,caps:{webgl2:renderer.capabilities.isWebGL2,halfFloat:gfxHalfFloat(),maxSamples:renderer.capabilities.maxSamples||0},deck:GFX.deck,touch:GFX.touch};}
function gfxPreview(id){GFX.force=GFX_PRESETS.includes(id)?id:'';GFX.broken=false;GFX.warned=false;gfxApply();return GFX.preset;}
gfxUiBuild();gfxApply();
