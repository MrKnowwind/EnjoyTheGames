var Vt=[["duck","\u6A61\u76AE\u9E2D",19],["car","\u62C9\u529B\u8D5B\u8F66",27],["pot","\u82B1\u76C6",23],["robot","\u94C1\u76AE\u673A\u5668\u4EBA",32],["cat","\u62DB\u8D22\u732B",25],["plane","\u6C34\u4E0A\u98DE\u673A",29],["kettle","\u8336\u58F6",24],["bug","\u74E2\u866B",21],["rocket","\u73A9\u5177\u706B\u7BAD",27],["sub","\u8FF7\u4F60\u6F5C\u8247",28],["shoe","\u8FD0\u52A8\u978B",24],["train","\u73A9\u5177\u706B\u8F66",31],["chest","\u5B9D\u7BB1",27]],T=(e,r)=>[e[0]+r[0],e[1]+r[1],e[2]+r[2]],A=(e,r)=>[e[0]-r[0],e[1]-r[1],e[2]-r[2]],y=(e,r)=>[e[0]*r,e[1]*r,e[2]*r],Et=(e,r)=>e[0]*r[0]+e[1]*r[1]+e[2]*r[2],tt=(e,r)=>[e[1]*r[2]-e[2]*r[1],e[2]*r[0]-e[0]*r[2],e[0]*r[1]-e[1]*r[0]],vt=e=>y(e,1/Math.max(1e-9,Math.hypot(...e))),bt=([e,r,t],n,i)=>[i*e+n*t,r,i*t-n*e],et=(e,r=0,t=1)=>Math.max(r,Math.min(t,e)),st=e=>{let r=et(e);return r*r*(3-2*r)},Mt=(e,r,t)=>e+(r-e)*t;function zt(e){let[r,t,n]=new Uint32Array(e,0,3),i=12+r*48,a=i+t*4;if(a+n*8!==e.byteLength)throw new Error("Invalid mesh length");return{vertices:new Float32Array(e,12,r*12),indices:new Uint32Array(e,i,t),sites:new Uint32Array(e,a,n*2)}}function se(e){let{vertices:r,indices:t}=e,n=[];for(let o=0;o<t.length;o+=3){let h=[0,1,2].map(s=>{let l=t[o+s]*12;return[r[l],r[l+1],r[l+2]]}),[f,c,m]=h;n.push({a:f,ab:A(c,f),ac:A(m,f),low:f.map((s,l)=>Math.min(s,c[l],m[l])),high:f.map((s,l)=>Math.max(s,c[l],m[l]))})}function i(o){let h=[1/0,1/0,1/0],f=[-1/0,-1/0,-1/0];for(let l of o)for(let u=0;u<3;u++)h[u]=Math.min(h[u],l.low[u]),f[u]=Math.max(f[u],l.high[u]);if(o.length<=12)return{low:h,high:f,list:o};let c=A(f,h),m=c.indexOf(Math.max(...c));o.sort((l,u)=>l.low[m]+l.high[m]-(u.low[m]+u.high[m]));let s=o.length>>1;return{low:h,high:f,left:i(o.slice(0,s)),right:i(o.slice(s))}}let a=i(n);return(o,h)=>{let f=1/0,c=h.map(s=>1/(Math.abs(s)<1e-7?1e-7:s));function m(s){let l=0,u=f;for(let w=0;w<3;w++){let g=(s.low[w]-o[w])*c[w],z=(s.high[w]-o[w])*c[w];if(l=Math.max(l,Math.min(g,z)),u=Math.min(u,Math.max(g,z)),u+1e-5<l)return}if(!s.list){m(s.left),m(s.right);return}for(let{a:w,ab:g,ac:z}of s.list){let E=tt(h,z),N=Et(g,E);if(Math.abs(N)<1e-6)continue;let v=A(o,w),b=Et(v,E)/N;if(b<0||b>1)continue;let U=tt(v,g),M=Et(h,U)/N;if(M<0||b+M>1)continue;let x=Et(z,U)/N;x>.001&&x<f&&(f=x)}}return m(a),Number.isFinite(f)?T(o,y(h,f)):null}}var Bt=(e,r,t)=>(t*64+r)*64+e,Pt=e=>et(Math.round(e*63/4),0,63);function oe(e){let r=Float32Array.from({length:e**3},()=>Math.random()),t=Array.from({length:64},(n,i)=>{let a=i*(e-1.001)/63;return[Math.floor(a),st(a%1)]});return(n,i,a)=>{let[o,h]=t[n],[f,c]=t[i],[m,s]=t[a],l=(m*e+f)*e+o,u=l+e*e,w=g=>Mt(r[g],r[g+1],h);return Mt(Mt(w(l),w(l+e),c),Mt(w(u),w(u+e),c),s)}}var At=class{constructor(r){this.sites=r,this.pixels=new Uint8Array(64**3),this.weights=new Uint32Array(64**3);let t=oe(9),n=oe(17),i=.24+.24*Math.random();for(let o=0;o<64;o++)for(let h=0;h<64;h++)for(let f=0;f<64;f++){let c=.8*t(f,h,o)+.2*n(f,h,o);this.pixels[Bt(f,h,o)]=Math.round(et((c-i)*4+.055,.055)*255)}this.initial=0;let a=0;for(let o=0;o<r.length;o+=2){let h=r[o],f=r[o+1];this.weights[h]=f,this.initial+=this.pixels[h]*f,a+=f}this.remaining=this.initial=Math.max(1,this.initial),this.coverage=this.initial/Math.max(1,a*255),this.changed=!0}get progress(){return 1-this.remaining/this.initial}wash(r,t,n,i){let[a,o,h]=[(r[0]+2)*63/4,r[1]*63/4,(r[2]+2)*63/4],f=t*63/4,c=E=>[Math.max(0,Math.floor(E-f)),Math.min(63,Math.ceil(E+f))],[m,s]=c(a),[l,u]=c(o),[w,g]=c(h),z=255*n*(i?7:3.9);for(let E=w;E<=g;E++)for(let N=l;N<=u;N++)for(let v=m;v<=s;v++){let b=((v-a)**2+(N-o)**2+(E-h)**2)/(f*f);if(b>=1)continue;let U=Bt(v,N,E),M=Math.min(this.pixels[U],Math.round(z*(1-b)));M&&(this.pixels[U]-=M,this.remaining-=M*this.weights[U],this.changed=!0)}}at(r){return this.pixels[Bt(Pt(r[0]+2),Pt(r[1]),Pt(r[2]+2))]}polish(){this.remaining=0,this.pixels.fill(0),this.changed=!0}};var B=Uint8Array,lt=Uint16Array,He=Int32Array,le=new B([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0]),he=new B([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,0,0]),qe=new B([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),fe=function(e,r){for(var t=new lt(31),n=0;n<31;++n)t[n]=r+=1<<e[n-1];for(var i=new He(t[30]),n=1;n<30;++n)for(var a=t[n];a<t[n+1];++a)i[a]=a-t[n]<<5|n;return{b:t,r:i}},ue=fe(le,2),ce=ue.b,Ze=ue.r;ce[28]=258,Ze[258]=28;var ve=fe(he,0),Ke=ve.b,Mr=ve.r,Wt=new lt(32768);for(d=0;d<32768;++d)K=(d&43690)>>1|(d&21845)<<1,K=(K&52428)>>2|(K&13107)<<2,K=(K&61680)>>4|(K&3855)<<4,Wt[d]=((K&65280)>>8|(K&255)<<8)>>1;var K,d,pt=(function(e,r,t){for(var n=e.length,i=0,a=new lt(r);i<n;++i)e[i]&&++a[e[i]-1];var o=new lt(r);for(i=1;i<r;++i)o[i]=o[i-1]+a[i-1]<<1;var h;if(t){h=new lt(1<<r);var f=15-r;for(i=0;i<n;++i)if(e[i])for(var c=i<<4|e[i],m=r-e[i],s=o[e[i]-1]++<<m,l=s|(1<<m)-1;s<=l;++s)h[Wt[s]>>f]=c}else for(h=new lt(n),i=0;i<n;++i)e[i]&&(h[i]=Wt[o[e[i]-1]++]>>15-e[i]);return h}),mt=new B(288);for(d=0;d<144;++d)mt[d]=8;var d;for(d=144;d<256;++d)mt[d]=9;var d;for(d=256;d<280;++d)mt[d]=7;var d;for(d=280;d<288;++d)mt[d]=8;var d,pe=new B(32);for(d=0;d<32;++d)pe[d]=5;var d;var je=pt(mt,9,1);var Ye=pt(pe,5,1),Gt=function(e){for(var r=e[0],t=1;t<e.length;++t)e[t]>r&&(r=e[t]);return r},O=function(e,r,t){var n=r/8|0;return(e[n]|e[n+1]<<8)>>(r&7)&t},Ot=function(e,r){var t=r/8|0;return(e[t]|e[t+1]<<8|e[t+2]<<16)>>(r&7)},_e=function(e){return(e+7)/8|0},$e=function(e,r,t){return(r==null||r<0)&&(r=0),(t==null||t>e.length)&&(t=e.length),new B(e.subarray(r,t))};var Je=["unexpected EOF","invalid block type","invalid length/literal","invalid distance","stream finished","no stream handler",,"no callback","invalid UTF-8 data","extra field too long","date not in range 1980-2099","filename too long","stream finishing","invalid zip data"],W=function(e,r,t){var n=new Error(r||Je[e]);if(n.code=e,Error.captureStackTrace&&Error.captureStackTrace(n,W),!t)throw n;return n},Qe=function(e,r,t,n){var i=e.length,a=n?n.length:0;if(!i||r.f&&!r.l)return t||new B(0);var o=!t,h=o||r.i!=2,f=r.i;o&&(t=new B(i*3));var c=function(ne){var ie=t.length;if(ne>ie){var ae=new B(Math.max(ie*2,ne));ae.set(t),t=ae}},m=r.f||0,s=r.p||0,l=r.b||0,u=r.l,w=r.d,g=r.m,z=r.n,E=i*8;do{if(!u){m=O(e,s,1);var N=O(e,s+1,3);if(s+=3,N)if(N==1)u=je,w=Ye,g=9,z=5;else if(N==2){var M=O(e,s,31)+257,x=O(e,s+10,15)+4,V=M+O(e,s+5,31)+1;s+=14;for(var S=new B(V),k=new B(19),R=0;R<x;++R)k[qe[R]]=O(e,s+R*3,7);s+=x*3;for(var $=Gt(k),Z=(1<<$)-1,J=pt(k,$,1),R=0;R<V;){var xt=J[O(e,s,Z)];s+=xt&15;var v=xt>>4;if(v<16)S[R++]=v;else{var at=0,Tt=0;for(v==16?(Tt=3+O(e,s,3),s+=2,at=S[R-1]):v==17?(Tt=3+O(e,s,7),s+=3):v==18&&(Tt=11+O(e,s,127),s+=7);Tt--;)S[R++]=at}}var Qt=S.subarray(0,M),Q=S.subarray(M);g=Gt(Qt),z=Gt(Q),u=pt(Qt,g,1),w=pt(Q,z,1)}else W(1);else{var v=_e(s)+4,b=e[v-4]|e[v-3]<<8,U=v+b;if(U>i){f&&W(0);break}h&&c(l+b),t.set(e.subarray(v,U),l),r.b=l+=b,r.p=s=U*8,r.f=m;continue}if(s>E){f&&W(0);break}}h&&c(l+131072);for(var Oe=(1<<g)-1,We=(1<<z)-1,Ft=s;;Ft=s){var at=u[Ot(e,s)&Oe],ot=at>>4;if(s+=at&15,s>E){f&&W(0);break}if(at||W(2),ot<256)t[l++]=ot;else if(ot==256){Ft=s,u=null;break}else{var te=ot-254;if(ot>264){var R=ot-257,ct=le[R];te=O(e,s,(1<<ct)-1)+ce[R],s+=ct}var Ct=w[Ot(e,s)&We],kt=Ct>>4;Ct||W(3),s+=Ct&15;var Q=Ke[kt];if(kt>3){var ct=he[kt];Q+=Ot(e,s)&(1<<ct)-1,s+=ct}if(s>E){f&&W(0);break}h&&c(l+131072);var ee=l+te;if(l<Q){var re=a-Q,Xe=Math.min(Q,ee);for(re+l<0&&W(3);l<Xe;++l)t[l]=n[re+l]}for(;l<ee;++l)t[l]=t[l-Q]}}r.l=u,r.p=Ft,r.b=l,r.f=m,u&&(m=1,r.m=g,r.d=w,r.n=z)}while(!m);return l!=t.length&&o?$e(t,0,l):t.subarray(0,l)};var tr=new B(0);var er=function(e){(e[0]!=31||e[1]!=139||e[2]!=8)&&W(6,"invalid gzip data");var r=e[3],t=10;r&4&&(t+=(e[10]|e[11]<<8)+2);for(var n=(r>>3&1)+(r>>4&1);n>0;n-=!e[t++]);return t+(r&2)},rr=function(e){var r=e.length;return(e[r-4]|e[r-3]<<8|e[r-2]<<16|e[r-1]<<24)>>>0};function me(e,r){var t=er(e);return t+8>e.length&&W(6,"invalid gzip data"),Qe(e.subarray(t,-8),{i:2},r&&r.out||new B(rr(e)),r&&r.dictionary)}var nr=typeof TextDecoder<"u"&&new TextDecoder,ir=0;try{nr.decode(tr,{stream:!0}),ir=1}catch{}var ge=`#version 300 es
precision highp float;
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aUv;
layout(location = 3) in vec3 aTint;
layout(location = 4) in float aSurface;
uniform mat4 uViewProj;
uniform mat4 uModel;
out vec3 vWorld;
out vec3 vLocal;
out vec3 vNormal;
out vec2 vUv;
out vec3 vTint;
flat out int vSurface;
void main() {
    vec4 p = uModel * vec4(aPosition, 1.0);
    vWorld = p.xyz;
    vLocal = aPosition;
    vNormal = normalize(mat3(uModel) * aNormal);
    vUv = aUv;
    vTint = aTint;
    vSurface = int(aSurface);
    gl_Position = uViewProj * p;
}\r
`;var de=`#version 300 es\r
precision highp float;\r
precision highp sampler3D;\r
in vec3 vWorld;\r
in vec3 vLocal;\r
in vec3 vNormal;\r
in vec2 vUv;\r
in vec3 vTint;\r
flat in int vSurface;\r
uniform sampler2D uBase;\r
uniform sampler2D uDetail;\r
uniform sampler2D uPacked;\r
uniform sampler3D uDirt;\r
uniform vec3 uStain;\r
uniform vec3 uEye;\r
uniform vec3 uHit;\r
uniform float uWashable;\r
uniform float uLucky;\r
uniform float uSpray;\r
uniform float uGleam;\r
uniform float uTime;\r
uniform float uFlow;\r
out vec4 outColor;\r
\r
const int VINYL = 8;\r
\r
vec2 atlas(vec2 uv) {\r
    vec2 slot = vec2(float(vSurface % 4), float(vSurface / 4));\r
    return (slot + (fract(uv) * 480.0 + 16.0) / 512.0) / vec2(4.0, 2.0);\r
}\r
\r
float hash(vec3 p) {\r
    vec3 q = fract(p * 0.1031);\r
    q += dot(q, q.yzx + 33.33);\r
    return fract((q.x + q.y) * q.z);\r
}\r
\r
vec3 illuminate(vec3 N, vec3 V, vec3 L, vec3 base, float rough, float metal, vec3 radiance) {\r
    vec3 H = normalize(V + L);\r
    float NL = max(dot(N, L), 0.0);\r
    float NV = max(dot(N, V), 0.001);\r
    float NH = max(dot(N, H), 0.0);\r
    float HV = max(dot(H, V), 0.0);\r
    float a = rough * rough;\r
    float a2 = a * a;\r
    float d = NH * NH * (a2 - 1.0) + 1.0;\r
    float distribution = a2 / max(3.14159 * d * d, 0.0002);\r
    float k = (rough + 1.0) * (rough + 1.0) / 8.0;\r
    float visibility = (NL / (NL * (1.0 - k) + k)) * (NV / (NV * (1.0 - k) + k));\r
    vec3 f0 = mix(vec3(0.04), base, metal);\r
    vec3 fresnel = f0 + (1.0 - f0) * pow(1.0 - HV, 5.0);\r
    vec3 spec = distribution * visibility * fresnel / max(4.0 * NL * NV, 0.001);\r
    vec3 diff = (1.0 - fresnel) * (1.0 - metal) * base / 3.14159;\r
    return (diff + min(spec, vec3(3.0))) * NL * radiance;\r
}\r
\r
void main() {\r
    vec3 n0 = normalize(vNormal);\r
    vec3 V = normalize(uEye);\r
    vec2 du = dFdx(vUv), dv = dFdy(vUv);\r
    vec3 px = dFdx(vWorld), py = dFdy(vWorld);\r
    vec3 N = n0;\r
    vec3 base = pow(vTint, vec3(2.2));\r
    float rough = 0.32;\r
    float metal = 0.0;\r
    float ao = 1.0;\r
    float wetSheen = 0.0;\r
    // Smooth molded vinyl uses mesh normals and soft highlights.\r
    if (vSurface != VINYL) {\r
        vec3 tangent = px * dv.y - py * du.y;\r
        float handed = (du.x * dv.y - du.y * dv.x < 0.0) ? -1.0 : 1.0;\r
        tangent = tangent * handed - n0 * dot(tangent * handed, n0);\r
        if (dot(tangent, tangent) < 1e-14) {\r
            tangent = cross(n0, abs(n0.y) < 0.95 ? vec3(0,1,0) : vec3(1,0,0));\r
        }\r
        vec3 T = normalize(tangent);\r
        vec3 B = normalize(cross(n0, T));\r
        B *= dot(B, (py * du.x - px * dv.x) * handed) < 0.0 ? -1.0 : 1.0;\r
        vec2 atlasDx = du * (480.0 / 512.0) / vec2(4.0, 2.0);\r
        vec2 atlasDy = dv * (480.0 / 512.0) / vec2(4.0, 2.0);\r
        vec2 sampleUv = vUv;\r
        // Micro-relief parallax confined to material UVs. World picking keeps the true silhouette.\r
        vec4 detail = textureGrad(uDetail, atlas(sampleUv), atlasDx, atlasDy);\r
        if (vSurface <= 3) {\r
            sampleUv -= vec2(dot(V, T), dot(V, B)) * (detail.a - 0.48) * 0.013\r
                / max(abs(dot(V, n0)), 0.4);\r
            detail = textureGrad(uDetail, atlas(sampleUv), atlasDx, atlasDy);\r
        }\r
        vec3 mapN = normalize(detail.xyz * 2.0 - 1.0);\r
        N = normalize(n0 * mapN.z + T * mapN.x + B * mapN.y);\r
        vec3 mapColor = textureGrad(uBase, atlas(sampleUv), atlasDx, atlasDy).rgb;\r
        vec3 materialData = textureGrad(uPacked, atlas(sampleUv), atlasDx, atlasDy).rgb;\r
        base = pow(vTint * mapColor, vec3(2.2));\r
        rough = max(0.18, materialData.r);\r
        metal = materialData.g;\r
        ao = materialData.b;\r
        if (vSurface == 5 || vSurface == 6) {\r
            N = normalize(mix(n0, N, 0.46));\r
            base = mix(base, pow(vTint, vec3(2.2)), 0.34);\r
        }\r
    }\r
\r
    if (uWashable > 0.5) {\r
        vec3 coord = (vLocal + vec3(2,0,2)) / 4.0;\r
        float mass = texture(uDirt, (coord * 63.0 + 0.5) / 64.0).r;\r
        float grain = hash(floor(vLocal * 145.0));\r
        float mud = smoothstep(0.008, 0.77, mass * (0.86 + 0.23 * grain));\r
        mud = max(mud, mass * 0.48);\r
        vec3 deposit = pow(uStain * (0.76 + 0.4 * grain), vec3(2.2));\r
        base = mix(base, deposit, mud * 0.97);\r
        rough = mix(rough, mix(0.84, 0.44, uLucky), mud);\r
        metal = mix(metal, uLucky * 0.68, mud);\r
        ao = mix(ao, 0.79 + grain * 0.18, mud);\r
        float wet = exp(-dot(vWorld - uHit, vWorld - uHit) * 5.0) * uSpray;\r
        wet *= 1.0 - mud;\r
        rough = max(0.16, rough - wet * 0.21 - (1.0 - mud) * uGleam * 0.11);\r
        vec3 halfVector = normalize(V + normalize(vec3(-0.45, 0.7, 0.62)));\r
        float trickle = smoothstep(0.80, 0.98, sin(vLocal.y * 59.0 + vLocal.x * 22.0 + uFlow * 8.0));\r
        wetSheen = wet * pow(max(dot(N, halfVector), 0.0), 6.0) * (0.15 + 0.27 * trickle);\r
    }\r
\r
    vec3 light = illuminate(N, V, normalize(vec3(-0.6, 0.85, 0.48)), base, rough, metal,\r
        vec3(2.15, 1.98, 1.7));\r
    light += illuminate(N, V, normalize(vec3(0.48, 0.5, -0.68)), base, rough, metal,\r
        vec3(0.60, 0.92, 1.22));\r
    vec3 reflected = reflect(-V, N);\r
    float sky = smoothstep(-0.7, 0.95, reflected.y);\r
    float fill = 0.50 + 0.45 * max(0.0, N.y);\r
    light += base * fill * ao * (1.0 - metal * 0.6);\r
    light += mix(vec3(0.027, 0.043, 0.058), vec3(0.10, 0.15, 0.19), sky)\r
        * mix(vec3(0.27), max(base, vec3(0.13)), metal) * (0.9 - 0.55 * rough);\r
    light += vec3(0.16, 0.22, 0.27) * pow(1.0 - max(dot(n0, V), 0.0), 3.0)\r
        * (0.3 + uWashable * 0.22);\r
    if (uGleam > 0.0 && uWashable > 0.5) {\r
        float sweep = 1.0 - smoothstep(0.0, 0.22,\r
            abs(vLocal.y * 0.67 + vLocal.x * 0.38 - uTime));\r
        light += vec3(0.85, 0.96, 1.0) * sweep * uGleam * (0.22 + 0.50 * sky);\r
    }\r
    light += vec3(0.53, 0.87, 1.0) * wetSheen;\r
    vec3 color = pow(clamp(light, 0.0, 1.0), vec3(1.0 / 2.2));\r
    outColor = vec4(color, 1.0);\r
}\r
\r
`;var ye=`#version 300 es
precision highp float;
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aUv;
layout(location = 2) in vec4 aColor;
layout(location = 3) in float aKind;
uniform mat4 uViewProj;
out vec2 vUv;
out vec4 vColor;
flat out int vKind;
void main() {
    vUv = aUv;
    vColor = aColor;
    vKind = int(aKind);
    gl_Position = uViewProj * vec4(aPosition, 1.0);
}\r
`;var we=`#version 300 es\r
precision highp float;\r
in vec2 vUv;\r
in vec4 vColor;\r
flat in int vKind;\r
uniform float uClock;\r
out vec4 outColor;\r
void main() {\r
    vec2 p = vUv * 2.0 - 1.0;\r
    float r = length(p);\r
    vec3 color = vColor.rgb;\r
    float a;\r
    if (vKind == 0) {\r
        // Moving pressure pulses travel from the nozzle to the impact.\r
        float pulse = 0.68 + 0.20 * sin(vUv.x * 57.0 - uClock * 34.0)\r
            + 0.12 * sin(vUv.x * 173.0 - uClock * 56.0);\r
        a = pow(max(0.0, 1.0 - abs(p.y)), 2.0) * pulse;\r
    } else if (vKind == 1) {\r
        a = 1.0 - smoothstep(0.60, 1.0, r);\r
        float glint = exp(-dot(p - vec2(-0.26, 0.30), p - vec2(-0.26, 0.30)) * 29.0);\r
        color = mix(color, vec3(1.0), glint * 0.8);\r
    } else if (vKind == 2) {\r
        float edge = 1.0 - smoothstep(0.09, 0.27, abs(r - 0.74));\r
        a = edge * (0.59 + p.y * 0.35) + (1.0 - smoothstep(0.0, 0.75, r)) * 0.12;\r
        color = mix(color, vec3(1.0), max(0.0, p.y) * 0.65);\r
    } else if (vKind == 3) {\r
        vec2 d = abs(p);\r
        float rays = pow(d.x, .59) + pow(d.y, .59);\r
        a = 1.0 - smoothstep(0.40, 0.99, rays);\r
        color = mix(color, vec3(1.0), 1.0 - smoothstep(0.07, 0.43, r));\r
    } else if (vKind == 4) {\r
        a = (1.0 - smoothstep(0.035, 0.20, abs(r - 0.78)));\r
        a *= 0.76 + 0.24 * sin(atan(p.y, p.x) * 3.0 - uClock * 5.0);\r
    } else if (vKind == 6) {\r
        float outline = 1.0 - smoothstep(0.025, 0.12, abs(r - 0.68));\r
        float center = 1.0 - smoothstep(0.11, 0.22, r);\r
        a = max(outline * 0.56, center * 0.77);\r
    } else {\r
        a = pow(max(0.0, 1.0 - r * r), 2.25);\r
    }\r
    outColor = vec4(color, a * vColor.a);\r
}\r
`;var I=[0,.45,.89302856],q=[0,.89302856,-.45],Ut=[0,1.9,0],hr=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]),fr=e=>[(e>>16&255)/255,(e>>8&255)/255,(e&255)/255];function Xt(e,r,t,n){return new Float32Array([...e,0,...r,0,...t,0,...n,1])}function Ht(e,r=1,t=[0,0,0]){let n=Math.sin(e)*r,i=Math.cos(e)*r;return Xt([i,0,-n],[0,r,0],[n,0,i],t)}function xe(e,r,t,n){let i=e.createVertexArray();return e.bindVertexArray(i),e.bindBuffer(e.ARRAY_BUFFER,t),e.bufferData(e.ARRAY_BUFFER,r,n),i}function Te(e,r){let t=0,n=4*r.reduce((i,a)=>i+a,0);r.forEach((i,a)=>{e.enableVertexAttribArray(a),e.vertexAttribPointer(a,i,e.FLOAT,!1,n,t),t+=4*i})}function Ee(e,r){let t=e.createProgram();for(let[a,o]of[e.VERTEX_SHADER,e.FRAGMENT_SHADER].entries()){let h=e.createShader(o);if(e.shaderSource(h,r[a]),e.compileShader(h),!e.getShaderParameter(h,e.COMPILE_STATUS))throw new Error(e.getShaderInfoLog(h));e.attachShader(t,h),e.deleteShader(h)}if(e.linkProgram(t),!e.getProgramParameter(t,e.LINK_STATUS))throw new Error(e.getProgramInfoLog(t));let n={},i=a=>n[a]??=e.getUniformLocation(t,a);return{use:()=>e.useProgram(t),f:(a,o)=>e.uniform1f(i(a),o),i:(a,o)=>e.uniform1i(i(a),o),v:(a,o)=>e.uniform3fv(i(a),o),mat:(a,o)=>e.uniformMatrix4fv(i(a),!1,o)}}async function ur(e,r){let t=new AbortController,n,i=a=>{clearTimeout(n),n=setTimeout(()=>t.abort(),a)};try{i(r?25e3:15e3);let a=await fetch(e,{signal:t.signal,cache:r?"reload":"default"});if(!a.ok)throw new Error("HTTP "+a.status);if(!a.body)return await a.blob();let o=a.body.getReader(),h=[];for(;;){i(r?2e4:12e3);let{done:f,value:c}=await o.read();if(f)return new Blob(h,{type:a.headers.get("Content-Type")||""});h.push(c)}}finally{clearTimeout(n)}}async function Me(e,r){let t="./assets/"+e;for(let n of[!1,!0])try{return await r(await ur(t,n))}catch(i){if(n)throw new Error("Could not load "+e,{cause:i})}}async function cr(e){if(typeof createImageBitmap=="function")try{return await createImageBitmap(e,{colorSpaceConversion:"none",premultiplyAlpha:"none"})}catch{}let r=new Image,t=URL.createObjectURL(e);try{return await new Promise((n,i)=>{r.onload=n,r.onerror=i,r.src=t}),r}finally{URL.revokeObjectURL(t)}}async function vr(e){let r=new Uint8Array(await e.slice(0,2).arrayBuffer());if(r[0]!==31||r[1]!==139)return zt(await e.arrayBuffer());if(typeof DecompressionStream=="function")try{let t=e.stream().pipeThrough(new DecompressionStream("gzip"));return zt(await new Response(t).arrayBuffer())}catch{}return zt(me(new Uint8Array(await e.arrayBuffer())).buffer)}var St=class{models=new Map;textures=new Map;particles=[];fx=new Float32Array(10800);used=0;constructor(r){if(this.canvas=r,this.gl=r.getContext("webgl2",{alpha:!1,antialias:!0}),!this.gl)throw new Error("WEBGL")}async load(r){let t=this.gl,n=["base_color","normal_height","rough_metal_ao"],i=["room","table","nozzle","duck"],a=[...n.map(l=>()=>this.loadTexture(l)),...i.map(l=>()=>this.loadModel(l))],o=[],h=0,f=0,c,m=async()=>{for(;h<a.length;){let l=h++;try{let u=await a[l]();l<n.length&&(o[l]=u),r(++f,a.length)}catch(u){c??=u}}};if(r(0,a.length),await Promise.all(Array.from({length:4},m)),c)throw c;this.lighting=Ee(t,[ge,de]),this.effects=Ee(t,[ye,we]),this.effectsBuffer=t.createBuffer(),this.effectsVAO=xe(t,this.fx.byteLength,this.effectsBuffer,t.STREAM_DRAW),Te(t,[3,2,4,1]),t.depthFunc(t.LEQUAL),t.enable(t.DEPTH_TEST),t.blendFunc(t.SRC_ALPHA,t.ONE_MINUS_SRC_ALPHA),t.clearColor(.43,.75,.89,1);let s=(l,u)=>{t.texParameteri(l,u,t.CLAMP_TO_EDGE)};t.pixelStorei(t.UNPACK_COLORSPACE_CONVERSION_WEBGL,t.NONE),o.forEach((l,u)=>{t.activeTexture(t.TEXTURE0+u),t.bindTexture(t.TEXTURE_2D,t.createTexture()),t.texImage2D(t.TEXTURE_2D,0,t.RGBA8,t.RGBA,t.UNSIGNED_BYTE,l),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAX_LEVEL,4),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR_MIPMAP_LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),s(t.TEXTURE_2D,t.TEXTURE_WRAP_S),s(t.TEXTURE_2D,t.TEXTURE_WRAP_T),t.generateMipmap(t.TEXTURE_2D),l.close?.()}),this.textures.clear(),t.activeTexture(t.TEXTURE3),t.bindTexture(t.TEXTURE_3D,t.createTexture()),t.texStorage3D(t.TEXTURE_3D,1,t.R8,64,64,64),t.texParameteri(t.TEXTURE_3D,t.TEXTURE_MIN_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_3D,t.TEXTURE_MAG_FILTER,t.LINEAR);for(let l of[t.TEXTURE_WRAP_S,t.TEXTURE_WRAP_T,t.TEXTURE_WRAP_R])s(t.TEXTURE_3D,l);this.lighting.use(),["uBase","uDetail","uPacked","uDirt"].forEach((l,u)=>this.lighting.i(l,u)),this.lighting.v("uEye",I),this.resize()}async loadTexture(r){if(this.textures.has(r))return this.textures.get(r);let t=Me("materials/"+r+".webp?v=2",cr);this.textures.set(r,t);try{return await t}catch(n){throw this.textures.delete(r),n}}async loadModel(r){if(this.models.has(r))return this.models.get(r);let t=(async()=>{let n=this.gl,i=await Me("models/"+r+".bin.gz",vr);return i.vao=xe(n,i.vertices,n.createBuffer(),n.STATIC_DRAW),Te(n,[3,3,2,3,1]),n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,n.createBuffer()),n.bufferData(n.ELEMENT_ARRAY_BUFFER,i.indices,n.STATIC_DRAW),n.bindVertexArray(null),i.sites.length&&(i.pick=se(i)),this[r]=i,i})();this.models.set(r,t);try{return await t}catch(n){throw this.models.delete(r),n}}resize(){let r=Math.min(devicePixelRatio||1,1.6),t=Math.max(1,Math.round(this.canvas.clientWidth*r)),n=Math.max(1,Math.round(this.canvas.clientHeight*r));this.canvas.width=t,this.canvas.height=n,this.gl.viewport(0,0,t,n),this.halfWidth=Math.max(2.64,4.15*t/n),this.halfHeight=this.halfWidth*n/t;let i=this.halfHeight,a=57.9;this.view=new Float32Array([1/this.halfWidth,0,0,0,0,q[1]/i,-2*I[1]/a,0,0,q[2]/i,-2*I[2]/a,0,0,-1.9*q[1]/i,(28+3.8*I[1]-58.1)/a,1])}ray(r,t){return T(T(Ut,y(I,13)),T([(2*r-1)*this.halfWidth,0,0],y(q,(1-2*t)*this.halfHeight)))}drawMesh(r,t){let n=this.gl;this.lighting.mat("uModel",t),n.bindVertexArray(r.vao),n.drawElements(n.TRIANGLES,r.indices.length,n.UNSIGNED_INT,0)}quad(r,t,n,i,a,o){if(!(this.used+60>this.fx.length))for(let[h,f,c]of[[r,0,0],[t,1,0],[n,1,1],[r,0,0],[n,1,1],[i,0,1]])this.fx.set([...h,f,c,...a,o],this.used),this.used+=10}bill(r,t,n,i,a){this.quad(A(A(r,t),n),T(A(r,n),t),T(T(r,t),n),T(A(r,t),n),i,a)}flush(r){if(!this.used)return;let t=this.gl;t.enable(t.BLEND),t.depthMask(!1),this.effects.use(),this.effects.mat("uViewProj",this.view),this.effects.f("uClock",r),t.bindVertexArray(this.effectsVAO),t.bindBuffer(t.ARRAY_BUFFER,this.effectsBuffer),t.bufferSubData(t.ARRAY_BUFFER,0,this.fx,0,this.used),t.drawArrays(t.TRIANGLES,0,this.used/10),t.depthMask(!0),t.disable(t.BLEND),this.used=0}burst(r,t,n){let i=n?[1,.83,.3]:t?[.95,1,.75]:[.64,.91,1];for(let a=0;a<(t?34:4);a++){this.particles.length>=110&&this.particles.shift();let o=Math.random()*Math.PI*2,h=Math.random()*1.3+.3;this.particles.push({p:r,v:[Math.cos(o)*h,.7+Math.random()*2,Math.sin(o)*h],life:t?.7+Math.random()*.6:.2+Math.random()*.32,age:0,color:i,finish:t})}}render(r){let t=this.gl,n=this.lighting,{dirt:i,item:a,modelMatrix:o,hit:h,target:f,nozzle:c,assist:m,time:s,tableAngle:l,dt:u,home:w,gleam:g,powered:z,stain:E}=r;i?.changed&&(t.activeTexture(t.TEXTURE3),t.texSubImage3D(t.TEXTURE_3D,0,0,0,0,64,64,64,t.RED,t.UNSIGNED_BYTE,i.pixels),i.changed=!1),t.clear(t.COLOR_BUFFER_BIT|t.DEPTH_BUFFER_BIT),n.use(),n.mat("uViewProj",this.view),n.f("uWashable",0),this.drawMesh(this.room,hr),this.drawMesh(this.table,Ht(l)),this.bill([0,.004,.17],[2.4,0,0],[0,0,2.38],[.03,.17,.21,.34],5);let N=o[12],v=o[13],b=Math.hypot(o[0],o[2]),U=Math.max(0,1-Math.abs(N)/1.5)*Math.max(0,.52-(v-.585)*.37);if(U&&this.bill([N,.589,0],[1.32*b,0,0],[0,0,1.12*b],[.02,.15,.25,U],5),this.flush(s),n.use(),n.f("uWashable",i&&!w?1:0),n.f("uLucky",E===12943389?1:0),n.f("uSpray",h?1:0),n.v("uHit",h??Ut),n.f("uFlow",s),n.v("uStain",fr(E)),n.f("uGleam",g),n.f("uTime",(1-g)*2-.22),this.drawMesh(a,o),!w){if(f){let M=vt(tt(A(f,c.outlet),I));for(let[x,V]of[[.078,[.3,.76,1,.55]],[.028,[.92,.99,1,.9]]]){let S=y(M,x*(z?1.6:1)),k=y(S,1.6);this.quad(A(c.outlet,S),A(f,k),T(f,k),T(c.outlet,S),V,0)}h&&this.bill(T(h,y(I,.027)),[.14,0,0],y(q,.14),[.68,.91,1,.85],4)}m&&this.bill(T(m,y(I,.06)),[.15,0,0],y(q,.15),[1,1,.91,1],6);for(let M=this.particles.length-1;M>=0;M--){let x=this.particles[M];if(x.age+=u,x.age>=x.life){this.particles.splice(M,1);continue}x.p=T(x.p,y(x.v,u)),x.v[1]-=u*2.8;let V=1-x.age/x.life,S=x.finish?.073:.036;this.bill(x.p,[S,0,0],y(q,S),[...x.color,V],x.finish?3:1)}this.flush(s),t.clear(t.DEPTH_BUFFER_BIT),n.use(),n.f("uWashable",0),this.drawMesh(this.nozzle,c.matrix)}}};var Rt=class{enabled=!0;constructor(){try{this.enabled=localStorage.getItem("sunny-glossvexa:sound")!=="off"}catch{}}unlock(){if(!this.enabled)return;let r=window.AudioContext??window.webkitAudioContext;if(r)try{if(!this.context){let t=this.context=new r;this.bus=t.createGain(),this.bus.gain.value=.5,this.bus.connect(t.destination);let n=t.createBuffer(1,2*t.sampleRate,t.sampleRate),i=n.getChannelData(0);for(let a=0;a<i.length;a++)i[a]=Math.random()*2-1;this.loop=t.createBufferSource(),this.loop.buffer=n,this.loop.loop=!0,this.filter=t.createBiquadFilter(),this.filter.type="bandpass",this.filter.Q.value=.65,this.flow=t.createGain(),this.flow.gain.value=0,this.loop.connect(this.filter).connect(this.flow).connect(this.bus),this.loop.start()}this.context.state!=="running"&&this.context.resume().catch(()=>{})}catch{}}toggle(){this.enabled=!this.enabled;try{localStorage.setItem("sunny-glossvexa:sound",this.enabled?"on":"off")}catch{}this.enabled&&this.unlock(),this.bus&&this.bus.gain.setTargetAtTime(this.enabled?.5:0,this.context.currentTime,.02),this.enabled&&this.chime([660],.07)}spray(r,t,n){if(!this.flow)return;let i=this.context.currentTime,a=r&&this.enabled?t?.21:.11:0;a===this.level&&t===this.impact&&n===this.powered||(this.level=a,this.impact=t,this.powered=n,this.flow.gain.setTargetAtTime(a,i,.035),this.filter.frequency.setTargetAtTime(t?950:n?3e3:2300,i,.045))}chime(r,t=.17){let n=this.context;!this.enabled||n?.state!=="running"||r.forEach((i,a)=>{let o=n.currentTime+a*.075,h=n.createOscillator(),f=n.createGain();h.type="sine",h.frequency.value=i,f.gain.setValueAtTime(.001,o),f.gain.exponentialRampToValueAtTime(.17,o+.012),f.gain.exponentialRampToValueAtTime(.001,o+t),h.connect(f).connect(this.bus),h.start(o),h.stop(o+t+.02),h.onended=()=>{h.disconnect(),f.disconnect()}})}};var p=e=>document.getElementById(e),H=new Rt,pr=p("workshop"),rt=p("wash-bay"),ut=p("pause-panel"),Re="sunny-glossvexa:records",_={coins:0,best:0,total:0};try{let e=JSON.parse(localStorage.getItem(Re));for(let r of Object.keys(_))Number.isSafeInteger(e?.[r])&&e[r]>=0&&(_[r]=e[r])}catch{}var mr=new Intl.NumberFormat("zh-CN"),gr=new Intl.NumberFormat("zh-CN",{notation:"compact",maximumFractionDigits:1}),Ae=e=>e<1e4?String(e):gr.format(e),gt=(e,r)=>{p(e).textContent!==r&&(p(e).textContent=r)},P,D="loading",X,jt,G,ht=-.58,be=.3,qt=0,L="arrival",F=0,ft=0,Lt=0,C=0,yt=0,Zt,nt=null,It=null,wt=null,ze=0,j=null,Yt=0,Dt=0,Ue=y(I,-1),dr=[0,1,0],yr=[.1,1.55,0],Nt=T(T(Ut,y(I,3.65)),T([.44*2.64,0,0],y(q,-.536*4.15))),Y=Nt,De=()=>Le(Vt[0],!1),_t=[7225642,5788775,4414273,7818860,9657145];function Le(e,r=!0){let t=r&&Math.random()<.15,n=r&&!t&&Math.random()<.18;return{name:e[0],label:(t?"\u91D1\u8272 ":n?"\u5927\u578B ":"")+e[1],value:e[2],lucky:t,scale:n?1.17:1,stain:t?12943389:_t[Math.floor(Math.random()*_t.length)]}}function wr(){let e=Vt.filter(([t])=>t!==X.name),r={order:Le(e[Math.floor(Math.random()*e.length)]),ready:!1};jt=r,P.loadModel(r.order.name).then(()=>{r.ready=!0}).catch(()=>{})}function Ne(e){X=e,G=new At(P[X.name].sites),L="arrival",F=0,yt=0,j=null,Yt=1.65,Dt=0,wt=null,wr()}function Ie(){H.unlock(),ft=0,Lt=0,C=0,ht=-.55,Y=Nt,P.particles.length=0,Ne(De()),it("wash"),H.chime([523,659],.1)}function it(e){D=e,pr.dataset.screen=D,It=null,wt=null,nt=null,p("home").hidden=D!=="home",p("hud").hidden=D==="loading",p("home-tools").hidden=D!=="home",p("wash-info").hidden=D==="home",p("pause").hidden=D!=="wash",p("energy").hidden=D==="home",p("reward").hidden=D!=="wash"||yt===0,p("hint").hidden=D!=="wash"||ft!==0||(G?.progress??0)>=.04,H.spray(!1,!1,!1),ke()}function Fe(){p("sound").setAttribute("aria-pressed",String(H.enabled))}Fe();p("sound").addEventListener("click",()=>{H.toggle(),Fe()});p("help").addEventListener("click",()=>{p("help-panel").showModal()});p("play").addEventListener("click",Ie);p("pause").addEventListener("click",Jt);p("resume").addEventListener("click",()=>{it("wash"),ut.close()});p("restart").addEventListener("click",()=>{Ie(),ut.close()});p("back").addEventListener("click",()=>{it("home"),ut.close()});ut.addEventListener("close",()=>{D==="paused"&&it("wash")});function Jt(){D==="wash"&&(it("paused"),ut.showModal())}document.addEventListener("visibilitychange",()=>{document.hidden&&Jt()});window.addEventListener("keydown",e=>{e.key==="Escape"&&D==="wash"&&(e.preventDefault(),Jt())});function Ce(e){let r=rt.getBoundingClientRect();It=[et((e.clientX-r.left)/r.width),et((e.clientY-r.top)/r.height)]}rt.addEventListener("pointerdown",e=>{D!=="wash"||nt!==null||e.button!==0||(e.preventDefault(),H.unlock(),nt=e.pointerId,rt.setPointerCapture(nt),Ce(e))});rt.addEventListener("pointermove",e=>{e.pointerId===nt&&Ce(e)});for(let e of["pointerup","pointercancel","lostpointercapture"])rt.addEventListener(e,r=>{r.pointerId===nt&&(nt=null,It=null,wt=null,H.spray(!1,!1,!1))});function ke(){if(gt("coins",Ae(_.coins)),gt("best",Ae(_.best)),!X||!G||D==="home")return;gt("item-name",X.label);let e=L==="gleam"||L==="departure"?100:Math.min(99,Math.round(G.progress*100));gt("percent",e+"%"),Se(p("clean-meter"),e);let r=p("energy");Se(r,Math.round((C>0?C/25:Lt/3)*100)),r.toggleAttribute("data-powered",C>0),p("hint").hidden=D!=="wash"||ft!==0||e>=4,p("reward").hidden=D!=="wash"||L!=="gleam",L==="gleam"&&gt("payout","+"+mr.format(yt)+" \u91D1\u5E01")}function Se(e,r){e.getAttribute("aria-valuenow")!==String(r)&&(e.style.setProperty("--amount",r+"%"),e.setAttribute("aria-valuenow",String(r)))}function xr(e,r){let t=vt(A(e,r)),n=vt(tt(Math.abs(t[1])>.98?I:dr,t)),i=A(y(n,.976),y(tt(t,n),.218)),a=tt(t,i),o=T(A(e,y(a,.155)),y(t,1.018));return{outlet:e,matrix:Xt(i,a,t,o)}}function Tr(e){G.polish(),L="gleam",F=0,ft++,yt=Math.round(X.value*X.scale**3+G.coverage*17)+Math.min(30,ft)+(X.lucky?45:0),_.coins+=yt,_.best=Math.max(_.best,ft),_.total++;try{localStorage.setItem(Re,JSON.stringify(_))}catch{}C<=0&&++Lt===3?(Lt=0,C=25,H.chime([523,659,784,1047],.32)):H.chime([659,784,988],.2),P.burst(T(e,[0,.82,0]),!0,C>0)}function Be(e){let r=Zt===void 0?0:Math.min(.045,(e-Zt)/1e3);if(Zt=e,D==="loading"||(requestAnimationFrame(Be),D==="paused"&&!$t))return;$t=!1;let t=D==="home",n=D==="wash",i=n||t?r:0;qt=(qt+i)%100,be+=i*(t?.41:.6),t&&(ht+=i*.41),n&&(F+=r,ht+=r*(L==="washing"?.6:.26),L==="arrival"&&F>=.86&&(L="washing",F=0),L==="gleam"&&F>=1.48&&(L="departure",F=0),L==="departure"&&F>=.76&&Ne(jt?.ready?jt.order:De()),L==="washing"&&(C=Math.max(0,C-r)));let a=[0,.585,0],o=t?1.07:X.scale,h=P.halfWidth+2.15;if(!t&&L==="arrival"&&(a=[h*(1-st(F/.86/.72)),.585+.67*(1-st((F/.86-.68)/.32)),0]),!t&&L==="departure"&&(a=[-h*st((F/.76-.27)/.73),.585+.67*st(F/.76/.31),0]),!t&&L==="gleam"){let v=Math.sin(F/1.48*Math.PI)**2*.065;a=[0,.585+v,0],o*=1+v*.36}let f=P[t?"duck":X.name],c=Math.sin(ht),m=Math.cos(ht),s=v=>y(bt(A(v,a),-c,m),1/o),l=v=>T(a,y(bt(v,c,m),o)),u=bt(Ue,-c,m),w=v=>f.pick(s(P.ray(...v)),u),g=n&&L==="washing"?It:null,z=null,E=null;if(g){let x=function(S,k){let R=s(S),$=A(k,R),Z=Math.hypot(...$),J=Z>.001&&f.pick(R,y($,1/Z));return J&&Math.hypot(...A(J,R))<=Z+.021?J:null},v=w(g),b=P.ray(...g);z=v?l(v):T(b,y(Ue,et((b[1]-.012)/I[1],.25,18)));let U=T(Nt,[(g[0]-.5)*.78,0,0]),M=T(U,y(q,(.61-g[1])*1.36)),V=M;if(v){let S=x(M,v);(!S||Math.hypot(...A(S,v))>.1)&&(V=T(z,y(I,3.48)))}if(Y=T(Y,y(A(V,Y),1-Math.exp(-r*21))),v){let S=wt??g,k=et(Math.ceil(Math.hypot(g[0]-S[0],g[1]-S[1])*35),1,6);for(let R=1;R<=k;R++){let $=R===k?v:w(S.map((J,xt)=>J+(g[xt]-J)*R/k));if(!$)continue;let Z=x(Y,$);Z&&(G.wash(Z,(C>0?.54:.32)/o,r/k,C>0),E=l(Z))}E&&(z=E)}E&&(ze+=r)>.035&&(ze=0,P.burst(E,!1,C>0)),G.progress>=.985&&Tr(a)}else Y=T(Y,y(A(Nt,Y),1-Math.exp(-r*9)));wt=g,H.spray(!!g&&L==="washing",!!E,C>0);let N=null;if(n&&L==="washing"&&G.progress>=.9){let v=b=>{let U=f.pick(A(b,y(u,6)),u);return U&&Math.hypot(...A(U,b))<.12};if(j&&(G.at(j)<15||!v(j))&&(j=null),!j&&(Yt-=r)<=0){Yt=.36;let b=22;for(let U=0;U<175;U++){Dt=(Dt+211)%(f.sites.length/2);let M=f.sites[2*Dt],x=G.pixels[M];if(x<=b)continue;let V=[M%64*4/63-2,(M>>6&63)*4/63,(M>>12)*4/63-2];v(V)&&(j=V,b=x)}}j&&(N=l(j))}P.render({item:f,dirt:t?null:G,modelMatrix:Ht(ht,o,a),hit:E,target:z,nozzle:xr(Y,z??yr),assist:N,time:qt,tableAngle:be,dt:i,home:t,gleam:!t&&L==="gleam"?1-F/1.6:0,powered:C>0,stain:X?.stain??_t[0]}),ke()}function Pe(e){p("loading").hidden=!1,p("loading-status").textContent=e,p("retry").hidden=!1,H.spray(!1,!1,!1)}var $t=!1,Kt=!1,dt=!1,Ve=new ResizeObserver(()=>{P.resize(),$t=!0});rt.addEventListener("webglcontextlost",e=>{e.preventDefault(),dt=!0,Ve.disconnect(),ut.close(),p("help-panel").close(),it("loading"),Pe("\u753B\u9762\u8FDE\u63A5\u5DF2\u4E2D\u65AD\uFF0C\u8BF7\u91CD\u8BD5\u3002")});async function Ge(){if(!Kt){Kt=!0,p("retry").hidden=!0,p("loading-status").textContent="\u6B63\u5728\u8FDE\u63A5\u5DE5\u574A\u2026";try{if(P??=new St(rt),await P.load((e,r)=>{dt||(p("loading-status").textContent=e===r?"\u6B63\u5728\u51C6\u5907\u5DE5\u574A\u753B\u9762\u2026":`\u6B63\u5728\u52A0\u8F7D\u5DE5\u574A\uFF08${e}/${r}\uFF09\u2026`)}),dt)return;Ve.observe(rt),p("loading").hidden=!0,it("home"),requestAnimationFrame(Be)}catch(e){dt||(Pe(e.message==="WEBGL"?"\u6B64\u6D4F\u89C8\u5668\u9700\u8981\u542F\u7528 WebGL 2 \u624D\u80FD\u8FDB\u5165\u5DE5\u574A\u3002":"\u5DE5\u574A\u8D44\u6E90\u6682\u65F6\u65E0\u6CD5\u52A0\u8F7D\uFF0C\u5DF2\u52A0\u8F7D\u7684\u8D44\u6E90\u5C06\u5728\u91CD\u8BD5\u65F6\u4FDD\u7559\u3002"),console.error(e))}finally{Kt=!1}}}p("retry").addEventListener("click",()=>{dt?location.reload():Ge()});Ge();
