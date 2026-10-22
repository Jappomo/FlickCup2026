// kit_mask: Kit colours: the ID map (R shirt, G shorts, B socks) takes the team colours over the colour texture; the kit pattern mask takes the second colours.
// Hook: after #include <map_fragment> (MeshStandardMaterial of the figures)
// Names you can use: diffuseColor, vUv, uIdMap, uHasId, uShirt, uShorts, uSocks, uPat, uHasPat, uShirt2, uShorts2, uSocks2
#ifdef USE_MAP
vec3 idm=uHasId>0.5?texture2D(uIdMap,vUv).rgb:vec3(smoothstep(0.45,0.7,min(min(diffuseColor.r,diffuseColor.g),diffuseColor.b)),0.,0.);
vec3 pm=uHasPat>0.5?texture2D(uPat,vUv).rgb:vec3(0.);
diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*mix(uShirt,uShirt2,pm.r),idm.r);
diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*mix(uShorts,uShorts2,pm.g),idm.g);
diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*mix(uSocks,uSocks2,pm.b),idm.b);
#endif
