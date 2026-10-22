// card_common: Common cards: the art as it is.
// Hook: card shader: cardUV() and cardColor() (the front of an Album card)
// Names you can use: map (the art; its alpha is the mask), uTime, uStrength. V = view direction in card space: x right, y up, z out of the card
// Common: plain art.
vec2 cardUV(vec2 uv, vec3 V){ return uv; }
vec3 cardColor(vec3 col, vec4 art, vec2 uv, vec3 V, vec3 N){ return col; }
