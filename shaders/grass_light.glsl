// grass_light: Grass is lit the same on both sides (no dark back faces).
// Hook: after #include <normal_fragment_begin> (menu preview grass)
// Names you can use: normal, viewMatrix
normal=normalize(mix(normalize((viewMatrix*vec4(0.0,1.0,0.0,0.0)).xyz),vec3(0.0,0.0,1.0),0.55));
