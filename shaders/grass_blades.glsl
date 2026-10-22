// grass_blades: Grass blades bend away from whatever stands in the middle and sway a little at the tip.
// Hook: after #include <begin_vertex> (menu preview grass blades)
// Names you can use: transformed, uTime, uR
float gh=max(transformed.y,0.0);vec2 gp=transformed.xz;float gd=length(gp);
float near=1.0-smoothstep(uR*0.8,uR*1.5,gd);
vec2 gdir=gd>1e-6?gp/gd:vec2(1.0,0.0);
transformed.xz+=gdir*gh*0.28*near;
transformed.y-=gh*0.05*near;
transformed.x+=sin(uTime*0.4+gp.x*420.0+gp.y*310.0)*gh*gh*40.0;
transformed.z+=cos(uTime*0.3+gp.y*380.0)*gh*gh*22.0;
