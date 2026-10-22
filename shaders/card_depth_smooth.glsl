// card_depth_smooth: the first Rare depth: a smooth height map (the sides of each shape show as a stretched extrusion). Kept to compare; Rare now uses card_depth (flat cut-out layers).
// Hook: card shader: cardUV() and cardColor() (the front of an Album card)
// Names you can use: map (the art; its alpha is the height), uTime, uStrength. V = view direction in card space: x right, y up, z out of the card
// Rare: parallax depth. The art's alpha is the height (white at the front, black at the back).
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
