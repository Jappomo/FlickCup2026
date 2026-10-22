// card_depth: Rare cards: depth as flat cut-out layers. The art's alpha says how deep each part sits (white = front, black = back, greys = layers in between).
// Hook: card shader: cardUV() and cardColor() (the front of an Album card)
// Names you can use: map (the art; its alpha is the depth), uTime, uStrength. V = view direction in card space: x right, y up, z out of the card
// Rare: flat cut-out layers, like a paper diorama. The art's alpha says how deep each part sits:
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
