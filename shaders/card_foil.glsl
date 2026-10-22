// card_foil: Uncommon cards: a holographic foil that moves with the viewing angle. The art's alpha says where the foil is (white = foil).
// Hook: card shader: cardUV() and cardColor() (the front of an Album card)
// Names you can use: map (the art; its alpha is the mask), uTime, uStrength. V = view direction in card space: x right, y up, z out of the card
// Uncommon: holographic foil where the art's alpha is white.
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
