import {centerLettering} from './assets/center-lettering.js?v=1';
import * as T from './vendor/three.module.js';
import {logoParts} from './assets/logo-geometry.js?v=10';

// Original stylized articulated instruments, modelled as actual 3D mesh assemblies.
// This is a brand animation, not an engineering model of a medical device.
export async function createIntro(panel, complete, ready = () => {}) {
  const logoTexture = await new T.TextureLoader().loadAsync('/assets/ege-logo.jpg');
  logoTexture.colorSpace=T.SRGBColorSpace;
  const stage = panel.querySelector('.hero-logo-stage') || panel.querySelector('.intro-stage');
  const renderer = new T.WebGLRenderer({antialias:true, alpha:true, powerPreference:'low-power'});
  // Supersample standard displays, respect HiDPI, and bound GPU memory.
  logoTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  renderer.setClearColor(0xf5f5f2, 0);
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  stage.append(renderer.domElement);
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(33, 1, .1, 100);
  camera.position.set(0, 1, 19);
  camera.lookAt(0,0,0);
  scene.add(new T.AmbientLight(0xffffff,.65));
  const key=new T.DirectionalLight(0xfff5e9,3.2);key.position.set(-3,5,9);
  key.castShadow=true;key.shadow.mapSize.set(2048,2048);
  Object.assign(key.shadow.camera,{left:-15,right:15,top:10,bottom:-10,near:.1,far:35});
  key.shadow.bias=-.00015;key.shadow.normalBias=.025;key.shadow.radius=3;scene.add(key);
  const fill=new T.DirectionalLight(0xd8e7ff,1.5);fill.position.set(6,-2,5);scene.add(fill);
  // Large studio cards reflected in the metal and lacquer.
  const studio=new T.Scene();studio.background=new T.Color(0x9da5b0);
  const cards=[];
  for(const [x,y,z,w,h,intensity] of [[-5,4,6,5,8,5],[6,1,4,3,7,3],[0,-6,3,8,2,2]]){
    const g=new T.PlaneGeometry(w,h),m=new T.MeshBasicMaterial({color:new T.Color().setScalar(intensity),side:T.DoubleSide});
    const card=new T.Mesh(g,m);card.position.set(x,y,z);card.lookAt(0,0,0);studio.add(card);cards.push(card);
  }
  const pmrem=new T.PMREMGenerator(renderer),environment=pmrem.fromScene(studio,.12);
  scene.environment=environment.texture;scene.environmentIntensity=.55;
  cards.forEach(c=>{c.geometry.dispose();c.material.dispose();});pmrem.dispose();
  const pearl = new T.MeshPhysicalMaterial({color:0xe9edee,metalness:.35,roughness:.23,clearcoat:1,clearcoatRoughness:.18});
  const steel = new T.MeshStandardMaterial({color:0x95a4b1,metalness:.8,roughness:.24});
  const dark = new T.MeshStandardMaterial({color:0x26313e,metalness:.65,roughness:.3});
  const red = new T.MeshPhysicalMaterial({color:0xc81632,metalness:.18,roughness:.29,clearcoat:1});
  const glow = new T.MeshStandardMaterial({color:0xf36a78,emissive:0xcf1838,emissiveIntensity:.7,roughness:.3});
  const geometries = new Set();
  function mesh(geometry,material,parent,x=0,y=0,z=0){geometries.add(geometry);const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function cylinder(parent,x,length,r1,r2,mat){const m=mesh(new T.CylinderGeometry(r1,r2,length,32),mat,parent,x);m.rotation.z=Math.PI/2;return m;}
  function ring(parent,x,r,thick,mat){const m=mesh(new T.TorusGeometry(r,thick,10,48),mat,parent,x);m.rotation.y=Math.PI/2;return m;}
  const floorMat=new T.MeshStandardMaterial({color:0xf4f3ef,roughness:.9,metalness:0});
  const floor=mesh(new T.PlaneGeometry(200,200),floorMat,scene,0,0,-.19);floor.castShadow=false;
  function arm(side){
    const group=new T.Group();scene.add(group);
    const upper=mesh(new T.CylinderGeometry(.25,.34,1,32),pearl,group);
    const fore=mesh(new T.CylinderGeometry(.15,.23,1,32),pearl,group);
    const trim=mesh(new T.CylinderGeometry(.09,.09,1,20),steel,group);
    const joints=[0,1,2].map(()=>mesh(new T.SphereGeometry(.31,28,20),dark,group));
    const caps=[0,1].map(()=>{const c=mesh(new T.CylinderGeometry(.19,.19,.1,32),steel,group);c.rotation.x=Math.PI/2;return c;});
    const wrist=new T.Group();group.add(wrist);
    cylinder(wrist,.13,.3,.15,.18,steel);ring(wrist,.04,.17,.026,red);
    cylinder(wrist,.38,.27,.075,.075,dark);
    const jaws=[];
    for(const sign of [-1,1]){
      const jaw=new T.Group();jaw.position.set(.49,sign*.052,0);wrist.add(jaw);
      const shape=new T.Shape();shape.moveTo(0,-.025);shape.lineTo(.32,-.02);shape.lineTo(.35,.009);shape.lineTo(.05,.05);shape.closePath();
      mesh(new T.ExtrudeGeometry(shape,{depth:.065,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:2}),steel,jaw,0,0,-.032);
      jaws.push({object:jaw,sign});
    }
    const support=mesh(new T.CylinderGeometry(.38,.38,1,32),pearl,group);
    return {side,group,upper,fore,trim,joints,caps,wrist,jaws,support};
  }
  const left=arm(1),right=arm(-1);
  function segment(object,a,b){object.position.copy(a).add(b).multiplyScalar(.5);object.scale.y=a.distanceTo(b);object.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize());}
  function pose(a,target,grip){
    const sign=a.side;
    // Stationary shoulder beyond the viewport. Two rigid links solve the wrist position.
    const base=new T.Vector3(-sign*(halfWidth+1.6),sign*.65,.85);
    const wrist=target.clone().add(new T.Vector3(-sign*.84,0,0));
    const delta=wrist.clone().sub(base),distance=delta.length(),direction=delta.clone().normalize();
    const length=(halfWidth+4.6)/2;
    const bend=new T.Vector3(-direction.y,direction.x,0).normalize();
    const elbow=base.clone().addScaledVector(direction,distance/2).addScaledVector(bend,Math.sqrt(Math.max(0,length*length-distance*distance/4)));
    segment(a.upper,base,elbow);segment(a.fore,elbow,wrist);
    segment(a.trim,elbow.clone().add(new T.Vector3(0,0,.19)),wrist.clone().add(new T.Vector3(0,0,.19)));
    [base,elbow,wrist].forEach((v,i)=>a.joints[i].position.copy(v));
    [base,elbow].forEach((v,i)=>a.caps[i].position.copy(v).add(new T.Vector3(0,0,.28)));
    segment(a.support,base,base.clone().add(new T.Vector3(-sign*5,0,0)));
    a.wrist.position.copy(wrist);a.wrist.rotation.y=sign===1?0:Math.PI;
    a.jaws.forEach(j=>j.object.rotation.z=j.sign*(.24-.22*grip));
  }
  const pieces=[];
  const edge=new T.MeshStandardMaterial({color:0x8e1428,metalness:.22,roughness:.32});
  const darkEdge=new T.MeshStandardMaterial({color:0x263139,metalness:.3,roughness:.32});
  const face=new T.MeshBasicMaterial({map:logoTexture,toneMapped:false});
  const centerTextFace=new T.MeshBasicMaterial({color:0x252b30,toneMapped:false});


  const scale=.016;
  logoParts.forEach((part,i)=>{
    const [cx,cy]=part.center,path=new T.ShapePath();
    for(const loop of part.loops){
      // Quadratic subpixel contours remove the former square-pixel silhouette.
      const points=loop.map(([x,y])=>new T.Vector2((x-cx)*scale,(cy-y)*scale));
      const first=points[0].clone().add(points[points.length-1]).multiplyScalar(.5);
      path.moveTo(first.x,first.y);
      points.forEach((p,k)=>{const next=points[(k+1)%points.length];path.currentPath.quadraticCurveTo(p.x,p.y,(p.x+next.x)/2,(p.y+next.y)/2);});
      path.currentPath.closePath();
    }
    if(i===4){
      path.subPaths=[];path.currentPath=null;
      for(let k=0;k<centerLettering.length;k++){
        const [x,y,type]=centerLettering[k],kind=type&7;
        if(kind===0)path.moveTo(x*scale,y*scale);
        else if(kind===1)path.lineTo(x*scale,y*scale);
        else if(kind===3){const b=centerLettering[++k],c=centerLettering[++k];path.bezierCurveTo(x*scale,y*scale,b[0]*scale,b[1]*scale,c[0]*scale,c[1]*scale);if(c[2]&128)path.currentPath.closePath();continue;}
        if(type&128)path.currentPath.closePath();
      }
    }
    const shapes=path.toShapes(false);
    const depth=i===2||i===4?.055:.16;
    const geometry=new T.ExtrudeGeometry(shapes,{depth,bevelEnabled:i!==2&&i!==4,bevelSegments:3,bevelSize:i===4?.006:.002,bevelThickness:i===4?.003:.002,curveSegments:3,
      UVGenerator:{generateTopUV:(g,v,a,b,c)=>[a,b,c].map(j=>new T.Vector2((v[j*3]/scale+cx)/551,1-(cy-v[j*3+1]/scale)/258)),generateSideWallUV:()=>[new T.Vector2(),new T.Vector2(),new T.Vector2(),new T.Vector2()]}});
    const group=new T.Group();scene.add(group);const logoMesh=mesh(geometry,[i===4?centerTextFace:face,i===2||i===4?darkEdge:edge],group,0,0,-.17);
    
    const final=new T.Vector3((cx-290)*scale,(126-cy)*scale,0);
    const offsets=[[-.65,.6],[.5,.6],[-.55,-.45],[.6,-.35],[-.45,-.65],[.55,.45]];
    const initial=final.clone().add(new T.Vector3(...offsets[i],0));
    pieces.push({group,final,initial,rotation:new T.Vector3(0,0,(i%2?1:-1)*.12)});
  });
  const jobs=[[pieces[0],pieces[2],pieces[4]],[pieces[1],pieces[3],pieces[5]]];
  // Shorter travel keeps the faster sequence calm instead of accelerating long sweeps.

  let mobile=false,halfWidth=8,frame,closed=false,elapsed=0,lastFrame=null,revealed=false;
  function resize(){const w=stage.clientWidth,h=stage.clientHeight;mobile=w<650;const ratio=Math.min(Math.max(window.devicePixelRatio||1,2),3,Math.sqrt(8294400/Math.max(1,w*h)));renderer.setPixelRatio(ratio);renderer.setSize(w,h);camera.aspect=w/h;camera.position.z=Math.max(18,10.5/(camera.aspect*2*Math.tan(T.MathUtils.degToRad(16.5))));camera.position.y=.7;camera.lookAt(0,0,0);camera.updateProjectionMatrix();halfWidth=camera.position.z*Math.tan(T.MathUtils.degToRad(16.5))*camera.aspect;}
  resize();window.addEventListener('resize',resize);
  const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*x*(x*(x*6-15)+10);};
  function animate(now){
    if(closed)return;
    if(lastFrame===null){lastFrame=now;ready();}
    if(!document.hidden) elapsed+=Math.min((now-lastFrame)/1000,.05);
    lastFrame=now;
    const t=elapsed;
    for(let side=0;side<2;side++){
      const a=side?right:left,sign=side?-1:1;

      let target=new T.Vector3(sign*-(halfWidth-.7),sign*.6,.5),grip=0;
      for(let j=0;j<3;j++){
        const p=jobs[side][j],phase=t-(.1+j*.65),carry=ease((phase-.18)/.31);
        p.group.position.lerpVectors(p.initial,p.final,carry);
        p.group.position.z+=Math.pow(Math.sin(carry*Math.PI),2)*.25;
        p.group.rotation.set(p.rotation.x*(1-carry),p.rotation.y*(1-carry),p.rotation.z*(1-carry));
        const anchor=new T.Vector3(sign*-.46,0,.16).applyEuler(p.group.rotation).add(p.group.position);
        if(phase>=0&&phase<.65){
          const previous=j?jobs[side][j-1].final.clone().add(new T.Vector3(sign*-.46,0,.16)):new T.Vector3(sign*-(halfWidth-.7),sign*.6,.5);
          target.lerpVectors(previous,anchor,ease(phase/.18));
          grip=ease((phase-.12)/.06)*(1-ease((phase-.52)/.08));
        }
      }
      if(t>=2.05){
        const final=jobs[side][2].final.clone().add(new T.Vector3(sign*-.46,0,.16));
        target.lerpVectors(final,new T.Vector3(sign*-(halfWidth-.7),sign*.6,.5),ease((t-2.05)/.35));
      }
      pose(a,target,grip);
    }
    if(t>2.05&&!revealed){revealed=true;}
    if(t>3.1){
      // Landing-page idle state: keep the same 3D logo alive instead of ending the scene.
      const idle=t-3.1;
      pieces.forEach((p,i)=>{
        p.group.position.y += Math.sin(idle*1.15+i*.7)*.0018;
        p.group.rotation.y = Math.sin(idle*.55+i*.8)*.035;
        p.group.rotation.x = Math.cos(idle*.45+i*.5)*.018;
      });
      left.group.rotation.y = Math.sin(idle*.5)*.018;
      right.group.rotation.y = -Math.sin(idle*.5)*.018;
    }
    renderer.render(scene,camera);
    frame=requestAnimationFrame(animate);
  }
  frame=requestAnimationFrame(animate);
  function dispose(){if(closed)return;closed=true;cancelAnimationFrame(frame);window.removeEventListener('resize',resize);renderer.domElement.removeEventListener('webglcontextlost',lost);geometries.forEach(g=>g.dispose());[pearl,steel,dark,red,edge,darkEdge,face,centerTextFace,glow,floorMat].forEach(m=>m.dispose());logoTexture.dispose();environment.dispose();key.shadow.map?.dispose();renderer.dispose();}
  function lost(e){e.preventDefault();complete();}
  renderer.domElement.addEventListener('webglcontextlost',lost);
  return dispose;
}

