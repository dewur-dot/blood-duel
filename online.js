(function(){
  'use strict';
  const config=window.BLOOD_DUEL_FIREBASE_CONFIG;
  let ready, checking=false, sending=false;
  if(config&&config.projectId&&window.firebase){
    try{
      firebase.initializeApp(config);
      ready=firebase.auth().signInAnonymously().then(()=>firebase.firestore());
    }catch(error){ ready=Promise.reject(error); }
  }else ready=Promise.reject(new Error('온라인 결투 설정이 아직 완료되지 않았습니다.'));

  const clone=value=>JSON.parse(JSON.stringify(value));
  const remember=id=>{
    if(!S.duels.includes(id)){ S.duels.push(id); S.duels=S.duels.slice(-100); saveState(); }
  };
  const say=message=>{
    ui.msg=message;
    const el=document.getElementById('sendmsg')||document.getElementById('codemsg');
    if(el) el.textContent=message;
    else { ui.notice=message; render(); }
  };
  const reason=error=>{
    console.error('온라인 결투 오류',error);
    if(!config||!config.projectId) return '온라인 결투 설정이 아직 완료되지 않았습니다.';
    if(error&&error.code==='permission-denied') return '결투 저장 권한이 없습니다. Firebase 인증과 보안 규칙을 확인해 주세요.';
    return '결투 서버에 연결하지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.';
  };
  const clearLink=()=>{ try{ const q=String(location.search||'').replace(/^\?/,'').split('&').filter(x=>x&&!/^invite=/.test(x)).join('&'); history.replaceState(null,'',location.pathname+(q?'?'+q:'')); }catch(_){} };

  const xml=value=>String(value??'').replace(/[&<>"']/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'
  })[char]);
  async function profileShareFile(hero){
    if(typeof File==='undefined'||typeof drawPortrait!=='function') return null;
    const bust=typeof bustCanvas==='function'?await bustCanvas(hero,680,850).catch(()=>null):null;
    const portrait=bust?'':drawPortrait(hero,false).replace('<svg ','<svg x="54" y="88" width="340" height="425" ');
    const stats=hero.st||{};
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <defs>
        <radialGradient id="bg" cx="35%" cy="20%" r="85%"><stop stop-color="#3b281c"/><stop offset="1" stop-color="#0e0d0c"/></radialGradient>
        <linearGradient id="panel" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#28211c"/><stop offset="1" stop-color="#171310"/></linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)"/>
      <rect x="28" y="28" width="1144" height="574" rx="18" fill="none" stroke="#6a594a" stroke-width="3"/>
      <rect x="54" y="88" width="340" height="425" rx="8" fill="url(#panel)" stroke="#9a8069" stroke-width="3"/>
      ${portrait}
      <text x="450" y="100" fill="#d8762a" font-size="28" font-weight="700" font-family="serif" letter-spacing="7">피의 결투장</text>
      <text x="450" y="180" fill="#f0e6d2" font-size="58" font-weight="800" font-family="serif">${xml(hero.name)}</text>
      <text x="450" y="225" fill="#d8762a" font-size="27" font-weight="700" font-family="sans-serif">${xml(hero.nick||'이름 없는 전사')}</text>
      <line x1="450" y1="258" x2="1110" y2="258" stroke="#5a5046" stroke-width="2"/>
      <text x="450" y="315" fill="#aaa090" font-size="25" font-family="sans-serif">신장</text><text x="610" y="315" fill="#f0e6d2" font-size="31" font-weight="700" font-family="sans-serif">${xml(hero.cm)} cm</text>
      <text x="790" y="315" fill="#aaa090" font-size="25" font-family="sans-serif">전적</text><text x="920" y="315" fill="#f0e6d2" font-size="31" font-weight="700" font-family="sans-serif">${xml(hero.wins||0)} 승</text>
      <text x="450" y="380" fill="#aaa090" font-size="25" font-family="sans-serif">체력</text><text x="610" y="380" fill="#f0e6d2" font-size="31" font-weight="700" font-family="sans-serif">${xml(hero.maxhp||stats.hp||0)}</text>
      <text x="790" y="380" fill="#aaa090" font-size="25" font-family="sans-serif">힘</text><text x="920" y="380" fill="#f0e6d2" font-size="31" font-weight="700" font-family="sans-serif">${xml(stats.str||0)}</text>
      <text x="450" y="445" fill="#aaa090" font-size="25" font-family="sans-serif">속도</text><text x="610" y="445" fill="#f0e6d2" font-size="31" font-weight="700" font-family="sans-serif">${xml(stats.spd||0)}</text>
      <text x="790" y="445" fill="#aaa090" font-size="25" font-family="sans-serif">지능</text><text x="920" y="445" fill="#f0e6d2" font-size="31" font-weight="700" font-family="sans-serif">${xml(stats.int||50)}</text>
      <rect x="450" y="490" width="660" height="70" rx="8" fill="#8d2018" stroke="#df6b3d" stroke-width="2"/>
      <text x="780" y="536" text-anchor="middle" fill="#fff4e8" font-size="28" font-weight="800" font-family="sans-serif">결투할 것인가, 도주할 것인가</text>
    </svg>`;
    const image=new Image();
    const source=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));
    try{
      await new Promise((resolve,reject)=>{ image.onload=resolve; image.onerror=reject; image.src=source; });
      const canvas=document.createElement('canvas'); canvas.width=1200; canvas.height=630;
      canvas.getContext('2d').drawImage(image,0,0);
      if(bust) canvas.getContext('2d').drawImage(bust,56,90,336,421);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png',.92));
      return blob?new File([blob],`${String(hero.name||'blood-duel').replace(/[^\w가-힣-]+/g,'-')}-결투장.png`,{type:'image/png'}):null;
    }catch(_){ return null; }
    finally{ URL.revokeObjectURL(source); }
  }

  // 카카오톡으로 보내기 (PC·폰 모두): 카카오 공유 SDK를 필요할 때만 불러옴
  const KAKAO_KEY='363a5ec461b3de7d399600c177f25fdf';
  let kakaoReady=null;
  function loadKakao(){ if(kakaoReady) return kakaoReady; kakaoReady=new Promise((res,rej)=>{ if(window.Kakao){ res(window.Kakao); return; } const s=document.createElement('script'); s.src='https://t1.kakaocdn.net/kakao_js_sdk/2.8.4/kakao.min.js'; s.crossOrigin='anonymous'; s.onload=()=>res(window.Kakao); s.onerror=()=>{ kakaoReady=null; rej(new Error('kakao-load')); }; document.head.appendChild(s); }); return kakaoReady; }
  async function kakaoShare(link,hero,letter){
    const K=await loadKakao(); if(!K.isInitialized()) K.init(KAKAO_KEY);
    const img=new URL('og.jpg',location.origin+location.pathname).href;
    K.Share.sendDefault({objectType:'feed',content:{title:`⚔ ${hero.name}의 결투 신청`,description:letter?`"${letter.slice(0,80)}"`:`${fmtH(hero.cm)} · ${hero.wins||0}킬 · 덤비든가 도망치든가`,imageUrl:img,imageWidth:1200,imageHeight:630,link:{mobileWebUrl:link,webUrl:link}},
      buttons:[{title:'결투장 열기',link:{mobileWebUrl:link,webUrl:link}}]});
  }
  async function send(copyOnly){
    if(!S.hero){ say('먼저 전사를 만들어 주세요.'); return; }
    if(sending) return;
    sending=true;
    try{
      const db=await ready;
      const uid=firebase.auth().currentUser.uid;
      const collection=db.collection('duels');
      const letter=ui.letter||'';
      // 아직 답이 없는 결투장이 있을 때: 문구가 같으면 그 결투장을 다시 공유하고,
      // 문구를 바꿨으면 이전 결투장을 취소하고 새 문구로 새 결투장을 만든다.
      if(S.pendingDuel){
        const oldRef=collection.doc(S.pendingDuel);
        const current=await oldRef.get();
        if(!current.exists||current.data().status!=='pending'){
          S.pendingDuel=null; saveState(); await checkDuels();
          say('이전 결투가 처리되었습니다. 결과를 확인한 뒤 다시 보내세요.'); return;
        }
        const oldLetter=unpackDuel(current.data().challenger)?.letter||'';
        if(oldLetter!==letter){
          const oldId=S.pendingDuel;
          try{
            await db.runTransaction(async transaction=>{
              const shot=await transaction.get(oldRef);
              if(!shot.exists||shot.data().status!=='pending') throw new Error('already-decided');
              transaction.update(oldRef,{status:'cancelled',decidedAt:firebase.firestore.FieldValue.serverTimestamp()});
            });
          }catch(error){
            if(error&&error.message==='already-decided'){
              S.pendingDuel=null; saveState(); await checkDuels();
              say('이전 결투가 처리되었습니다. 결과를 확인한 뒤 다시 보내세요.'); return;
            }
            throw error;
          }
          if(!S.handledDuels.includes(oldId)) S.handledDuels.push(oldId);
          S.pendingDuel=null; saveState();
        }
      }
      const ref=S.pendingDuel?collection.doc(S.pendingDuel):collection.doc();
      if(!S.pendingDuel){
        await ref.set({version:1,status:'pending',ownerUid:uid,ownerHeroId:S.hero.id,
          challenger:packDuel(S.hero,letter),createdAt:firebase.firestore.FieldValue.serverTimestamp()});
        S.pendingDuel=ref.id; S.pendingTo=''; saveState(); render();
      }
      remember(ref.id);
      const link=baseUrl()+'?invite='+ref.id+'#duel-id='+ref.id;
      const intro=`⚔ ${S.hero.name}의 결투 신청`+(ui.letter?`\n\n"${ui.letter}"`:'');
      const message=intro+`\n\n${link}`;
      if(copyOnly==='kakao'){
        try{ await kakaoShare(link,S.hero,ui.letter||''); say('카카오톡 보내기 창을 열었다. 친구를 골라 보내라.'); return; }
        catch(error){ console.warn('카카오 공유 실패',error); const why=String(error&&(error.message||error.msg||error)||''); try{ await navigator.clipboard.writeText(message); }catch(_){}
          say('카카오톡 보내기를 열지 못했다'+(why?` (${why.slice(0,80)})`:'')+'. 대신 결투 링크를 복사해 뒀으니 카톡에 붙여넣어라.'); return; }
      }
      if(copyOnly==='share') copyOnly=false;
      if(!copyOnly&&navigator.share){
        try{
          const file=await profileShareFile(S.hero);
          const payload=file&&navigator.canShare&&navigator.canShare({files:[file]})
            ?{title:'피의 결투',text:intro,url:link,files:[file]}
            :{title:'피의 결투',text:message};
          await navigator.share(payload);
          say(file&&payload.files?'전사 프로필과 결투장을 보냈습니다. 상대의 선택은 이 기기에서 게임을 다시 열면 확인할 수 있습니다.':'결투장을 보냈습니다. 상대의 선택은 이 기기에서 게임을 다시 열면 확인할 수 있습니다.');
          return;
        }
        catch(error){ if(error&&error.name==='AbortError'){ say('공유를 취소했습니다. 결투장은 생성되어 있습니다.'); return; } }
      }
      try{ await navigator.clipboard.writeText(copyOnly?link:message); say('결투 링크를 복사했습니다. 카카오톡에 붙여넣어 보내세요.'); }
      catch(_){ showCode(copyOnly?link:message); say('아래 결투 링크를 직접 복사해 보내세요.'); }
    }catch(error){ say(reason(error)); }
    finally{ sending=false; }
  }

  async function open(id){
    if(!/^[A-Za-z0-9]{20}$/.test(id)){ say('결투 링크가 올바르지 않습니다.'); return; }
    try{
      const db=await ready;
      const shot=await db.collection('duels').doc(id).get();
      if(!shot.exists){ clearLink(); closedDuel('찾을 수 없는 결투장입니다'); return; }
      const data=shot.data();
      if(data.status!=='pending'){
        clearLink();
        if(data.status==='accepted'&&applyResult(id,data,true)) return;
        closedDuel('이미 초대가 종료된 결투장입니다');
        return;
      }
      if(data.ownerUid===firebase.auth().currentUser.uid){ say('내가 보낸 결투장입니다. 친구에게 링크를 보내세요.'); return; }
      const challenger=unpackDuel(data.challenger);
      if(!challenger){ say('결투장 데이터를 읽지 못했습니다.'); return; }
      remember(id);
      ui.incoming=challenger; ui.duelId=id; view='incoming'; render(); window.scrollTo(0,0);
    }catch(error){ say(reason(error)); }
  }

  const flipLog=log=>log.map(entry=>{
    const e={...entry};
    if(e.by==='A') e.by='B'; else if(e.by==='B') e.by='A';
    if(e.target==='A') e.target='B'; else if(e.target==='B') e.target='A';
    [e.hpA,e.hpB]=[entry.hpB,entry.hpA];
    [e.sA,e.sB]=[entry.sB,entry.sA];
    return e;
  });

  let mercyWait=null;
  function applyResult(id,data,show){
    if(S.handledDuels.includes(id)) return false;
    const uid=firebase.auth().currentUser.uid;
    const isOwner=data.ownerUid===uid;
    const isRecipient=data.recipientUid===uid;
    if(!isOwner&&!isRecipient) return false;
    const expectedId=isOwner?data.ownerHeroId:data.recipientHeroId;
    if(!S.hero||S.hero.id!==expectedId){
      S.handledDuels.push(id); saveState();
      ui.notice='이 결투의 전사는 현재 전사와 다릅니다. 이전 전사의 결과는 반영하지 않았습니다.';
      if(show) render();
      return false;
    }
    const result=data.result;
    if(!result||!Array.isArray(result.log)) return false;
    const me=S.hero;
    const opponent=unpackDuel(isOwner?data.recipient:data.challenger);
    if(!opponent) return false;
    const isDraw=!!result.draw;
    const won=!isDraw&&(isOwner?result.winner==='B':result.winner==='A');
    const myIdX=isOwner?'B':'A';
    // 내가 졌고 이긴 쪽(받은 사람)이 아직 살려줄지 정하는 중이면(최대 1분) 잠시 기다림
    let spared=false;
    if(isOwner&&!won&&!isDraw&&result.fled!==myIdX){
      if(data.spared===true) spared=true;
      else if(data.spared===undefined){ const dt=data.decidedAt&&data.decidedAt.toMillis?Date.now()-data.decidedAt.toMillis():1e9; if(dt<75000){ if(!mercyWait){ mercyWait=setTimeout(()=>{ mercyWait=null; checkDuels(); },Math.max(3000,76000-dt)); } const m='상대가 너의 목숨을 저울질하고 있다… 살려줄지, 벨지. 잠시 뒤 결과가 나온다.'; if(show&&ui.notice!==m){ ui.notice=m; render(); } return false; } } }
    const myId=isOwner?'B':'A', iFled=result.fled===myId, theyFled=!!result.fled&&!iFled;
    const rep={me:clone(me),foe:opponent,log:isOwner?flipLog(result.log):result.log,
      win:won,draw:isDraw,sparedMe:spared?1:0,broke:null,gain:null,fled:result.fled?(isOwner?(result.fled==='A'?'B':'A'):result.fled):null};
    if(isDraw||spared){ me.hp=me.maxhp; sync(me,true); }
    else if(won){ rep.gain=grow(me,opponent); rep.gold=typeof winGold==='function'?winGold(me):0; if(theyFled) rep.plunder=null; else if(isRecipient&&show){ rep.mercy='ask'; rep.duelId=id; } else rep.plunder=typeof plunderHelm==='function'?plunderHelm(me,opponent):null; rep.wins=me.wins; sync(me,true); }
    else if(iFled&&typeof cowardize==='function'){ cowardize(me); sync(me,true); }
    else{
      const last=result.log[result.log.length-1];
      bury(me,last?last.text:'전사');
    }
    S.fights++;
    if(S.pendingDuel===id) S.pendingDuel=null;
    S.pendingReplay=rep;
    S.handledDuels.push(id); saveState();
    ui.duelId=null; ui.incoming=null; clearLink();
    if(show){ ui.rep=rep; view='battle'; render(); }
    return true;
  }

  async function accept(){
    const id=ui.duelId;
    if(!id||!S.hero){ say('먼저 전사를 만들어 주세요.'); return; }
    const button=document.querySelector('[data-act="acceptin"]');
    if(button){ button.disabled=true; button.textContent='결투 준비 중…'; }
    try{
      const db=await ready;
      const outgoingId=S.pendingDuel;
      if(outgoingId&&outgoingId!==id){
        const outgoingRef=db.collection('duels').doc(outgoingId);
        const outgoingShot=await outgoingRef.get();
        if(outgoingShot.exists){
          const outgoing=outgoingShot.data();
          if(outgoing.status==='accepted'){
            applyResult(outgoingId,outgoing,true);
            throw new Error('outgoing-decided');
          }
          if(outgoing.status==='pending'&&outgoing.ownerUid===firebase.auth().currentUser.uid){
            await outgoingRef.update({status:'cancelled',decidedAt:firebase.firestore.FieldValue.serverTimestamp()});
          }
        }
        if(!S.handledDuels.includes(outgoingId)) S.handledDuels.push(outgoingId);
        S.pendingDuel=null; saveState();
      }
      const ref=db.collection('duels').doc(id);
      const shot=await ref.get();
      if(!shot.exists||shot.data().status!=='pending') throw new Error('already-decided');
      const data=shot.data();
      if(data.ownerUid===firebase.auth().currentUser.uid) throw new Error('own-duel');
      const opponent=unpackDuel(data.challenger);
      if(!opponent) throw new Error('bad-challenge');
      const me=clone(S.hero), a=clone(me), b=clone(opponent);
      a.hp=a.maxhp; b.hp=b.maxhp;
      a.st.def+=outfitDef(me); b.st.def+=outfitDef(opponent);
      const outcome=fight(a,b);
      const recipient=packDuel(me,'');
      const result={winner:outcome.winner,log:outcome.log}; if(outcome.fled) result.fled=outcome.fled; if(outcome.draw) result.draw=true;
      await db.runTransaction(async transaction=>{
        const current=await transaction.get(ref);
        if(!current.exists||current.data().status!=='pending') throw new Error('already-decided');
        transaction.update(ref,{status:'accepted',recipientUid:firebase.auth().currentUser.uid,
          recipientHeroId:me.id,recipient,result,decidedAt:firebase.firestore.FieldValue.serverTimestamp()});
      });
      applyResult(id,{...data,status:'accepted',recipientUid:firebase.auth().currentUser.uid,
        recipientHeroId:me.id,recipient,result},true);
    }catch(error){
      if(error.message==='outgoing-decided') say('먼저 도착한 결투 결과를 확인해 주세요.');
      else if(error.message==='already-decided'){ clearLink(); closedDuel('이미 초대가 종료된 결투장입니다'); }
      else say(reason(error));
      if(button){ button.disabled=false; button.textContent='덤벼라'; }
    }
  }

  async function decline(){
    const id=ui.duelId;
    if(!id) return;
    try{
      const db=await ready, ref=db.collection('duels').doc(id);
      await db.runTransaction(async transaction=>{
        const current=await transaction.get(ref);
        if(!current.exists||current.data().status!=='pending') throw new Error('already-decided');
        if(current.data().ownerUid===firebase.auth().currentUser.uid) throw new Error('own-duel');
        transaction.update(ref,{status:'declined',recipientUid:firebase.auth().currentUser.uid,
          decidedAt:firebase.firestore.FieldValue.serverTimestamp()});
      });
      S.handledDuels.push(id); saveState();
      ui.duelId=null; ui.incoming=null; clearLink();
      ui.notice='결투를 거절하고 도주했습니다.';
      view=S.hero?'card':'home'; render();
    }catch(error){ if(error.message==='already-decided'){ clearLink(); closedDuel('이미 초대가 종료된 결투장입니다'); } else say(reason(error)); }
  }

  async function checkDuels(){
    if(checking||view==='battle'||ui.duelId) return;
    checking=true;
    try{
      const db=await ready;
      if(S.pendingReplay){ ui.rep=S.pendingReplay; view='battle'; render(); return; }
      for(const id of [...S.duels]){
        if(S.handledDuels.includes(id)) continue;
        const shot=await db.collection('duels').doc(id).get();
        if(!shot.exists) continue;
        const data=shot.data();
        if(data.status==='accepted'&&applyResult(id,data,true)) return;
        if(data.status==='declined'||data.status==='cancelled'){
          if(S.pendingDuel===id) S.pendingDuel=null;
          S.handledDuels.push(id); saveState();
          if(data.ownerUid===firebase.auth().currentUser.uid){ ui.notice=data.status==='declined'?'상대가 결투를 거절하고 도주했습니다.':'결투장이 취소되었습니다.'; render(); }
        }
      }
    }catch(error){ console.error('결투 결과 확인 실패',error); }
    finally{ checking=false; }
  }

  async function cancel(){
    if(!S.pendingDuel) return;
    try{
      const db=await ready, id=S.pendingDuel, ref=db.collection('duels').doc(id);
      await db.runTransaction(async transaction=>{
        const shot=await transaction.get(ref);
        if(!shot.exists||shot.data().status!=='pending') throw new Error('already-decided');
        transaction.update(ref,{status:'cancelled',decidedAt:firebase.firestore.FieldValue.serverTimestamp()});
      });
      S.pendingDuel=null; S.handledDuels.push(id); saveState();
      ui.notice='보낸 결투장을 취소했습니다.'; render();
    }catch(error){
      if(error.message==='already-decided'){ await checkDuels(); if(S.pendingDuel){ ui.notice='상대가 이미 답했다. 결과를 불러오는 중이다…'; render(); } }
      else { // 서버가 거부해도 묶여 있지 않게: 상태를 다시 보고, 대기 중이 아니면 내 쪽에서 풀어줌
        try{ const db=await ready, shot=await db.collection('duels').doc(S.pendingDuel).get(); if(!shot.exists||shot.data().status==='cancelled'||shot.data().status==='declined'){ S.handledDuels.push(S.pendingDuel); S.pendingDuel=null; saveState(); ui.notice='보낸 결투장을 거뒀다.'; render(); return; } }catch(_){ }
        say(reason(error)); }
    }
  }
  /* 랭킹: 실제로 플레이한 전사들 */
  const pushT={};
  function pushHero(h,alive){
    if(!h||!h.id) return;
    const data={hero:packDuel(h,''),name:String(h.name||'').slice(0,20),kills:Math.max(0,h.wins|0),alive:!!alive};
    clearTimeout(pushT[h.id]);
    pushT[h.id]=setTimeout(async()=>{
      try{
        const db=await ready, uid=firebase.auth().currentUser.uid;
        await db.collection('heroes2').doc(h.id).set({...data,uid,updatedAt:firebase.firestore.FieldValue.serverTimestamp()});
      }catch(error){ console.warn('랭킹 저장 실패',error&&error.code||error); }
    },alive?1200:0);
  }
  // 시즌 2 = heroes2, 시즌 1 기록은 heroes 컬렉션에 따로 보관 (읽기 전용)
  async function loadBoard(season){
    const old=season===1;
    try{
      const db=await ready;
      const qs=await db.collection(old?'heroes':'heroes2').orderBy('kills','desc').limit(200).get(); // 현생·발할라로 나눠 보여주려고 넉넉히
      const list=[];
      qs.forEach(doc=>{ const d=doc.data(), h=d&&unpackDuel(d.hero); if(!h) return;
        list.push({id:doc.id,name:h.name,flag:h.flag||'',nick:h.nick,g:h.g,st:h.st,cm:h.cm,kg:h.kg,outfit:h.outfit,weapon:h.weapon,tags:h.tags,kills:Math.max(0,d.kills|0),alive:d.alive!==false,uid:d.uid||''}); });
      if(old){ ui.board1=list; ui.board1Err=false; } else { ui.board=list; ui.boardErr=false; }
    }catch(error){ console.warn('랭킹 불러오기 실패',error&&error.code||error); if(old) ui.board1Err=true; else ui.boardErr=true; }
    if(view==='rank') render();
  }
  /* 후원 보상 코드: 서버에서 한 번만 쓸 수 있게 확인 */
  async function redeem(code){
    const show=m=>{ ui.rmsg=m; const e=document.getElementById('redeemMsg'); if(e) e.textContent=m; };
    if(!/^[A-Z0-9]{8,16}$/.test(code||'')){ show('코드를 다시 확인해라. 영어 대문자와 숫자다.'); return; }
    show('오딘이 공물을 확인하는 중…');
    try{
      const db=await ready, ref=db.collection('codes').doc(code), uid=firebase.auth().currentUser.uid;
      const data=await db.runTransaction(async t=>{
        const shot=await t.get(ref);
        if(!shot.exists) throw new Error('no-code');
        const d=shot.data(); if(d.redeemedBy) throw new Error('used');
        t.update(ref,{redeemedBy:uid,redeemedAt:firebase.firestore.FieldValue.serverTimestamp()});
        return d;
      });
      const g=Math.max(0,data.gold|0), r=data.rename?1:0;
      S.gold=(S.gold||0)+g; S.renameT=(S.renameT||0)+r; S.redeemed=(S.redeemed||[]).concat(code).slice(-50); saveState();
      ui.rmsg=`공물이 받아들여졌다. +${g.toLocaleString('ko-KR')} 골드${r?' · 이름변경 쿠폰 +1장':''}`; render();
    }catch(error){
      show(error.message==='no-code'?'그런 코드는 없다.':error.message==='used'?'이미 누군가 써버린 코드다.':reason(error));
    }
  }
  /* ---- 게임 안에서 바로 결투장 보내기 (랭킹에서 상대를 골라) + 받기 거부·차단 ---- */
  async function prefsOf(db,uid){ try{ const s=await db.collection('prefs').doc(uid).get(); return s.exists?s.data():{}; }catch(_){ return {}; } }
  async function sendTo(target){
    if(!S.hero){ say('먼저 전사를 만들어 주세요.'); return; }
    if(!target||!target.uid){ say('이 전사에게는 결투장을 보낼 수 없다.'); return; }
    if(S.pendingDuel){ ui.notice='이미 보낸 결투장이 있다. 답을 받거나 취소한 뒤에 다시 던져라.'; render(); return; }
    if(sending) return; sending=true;
    try{
      const db=await ready, uid=firebase.auth().currentUser.uid;
      if(target.uid===uid){ ui.notice='자기 자신에게 결투장을 던질 순 없다.'; render(); return; }
      const pf=await prefsOf(db,target.uid);
      if(pf.noInvite||(Array.isArray(pf.blocked)&&pf.blocked.includes(uid))){ ui.notice=`${target.name||'그 전사'}는 결투장을 받지 않는다.`; render(); return; }
      const ref=db.collection('duels').doc();
      await ref.set({version:1,status:'pending',ownerUid:uid,ownerHeroId:S.hero.id,targetUid:target.uid,
        challenger:packDuel(S.hero,ui.letter||''),createdAt:firebase.firestore.FieldValue.serverTimestamp()});
      S.pendingDuel=ref.id; S.pendingTo=target.name||''; remember(ref.id); saveState();
      ui.notice=`${target.name||'상대'}에게 결투장을 던졌다. 놈이 받으면 바로 결투가 시작된다.`; view=S.hero?'card':'home'; render();
    }catch(error){ ui.notice=reason(error); render(); }
    finally{ sending=false; }
  }
  // 나에게 온 결투장 실시간 확인
  let inboxOff=null;
  async function watchInbox(){
    try{
      const db=await ready, uid=firebase.auth().currentUser.uid; if(inboxOff) return;
      inboxOff=db.collection('duels').where('targetUid','==',uid).where('status','==','pending').onSnapshot(qs=>{
        const list=[]; qs.forEach(doc=>{ const d=doc.data(), h=unpackDuel(d.challenger); if(h&&!(S.blocked||[]).includes(d.ownerUid)) list.push({id:doc.id,name:h.name,owner:d.ownerUid,letter:h.letter||''}); });
        const before=(ui.inbox||[]).map(x=>x.id).join(); ui.inbox=S.noInvite?[]:list;
        if(ui.inbox.map(x=>x.id).join()!==before&&view!=='battle'&&view!=='war') render();
      },error=>console.warn('받은 결투장 확인 실패',error&&error.code||error));
    }catch(error){ console.warn('받은 결투장 확인 실패',error); }
  }
  async function declineId(id,block){
    try{
      const db=await ready, uid=firebase.auth().currentUser.uid, ref=db.collection('duels').doc(id);
      const item=(ui.inbox||[]).find(x=>x.id===id);
      await db.runTransaction(async tr=>{ const cur=await tr.get(ref); if(!cur.exists||cur.data().status!=='pending') return; tr.update(ref,{status:'declined',recipientUid:uid,decidedAt:firebase.firestore.FieldValue.serverTimestamp()}); });
      if(block&&item&&item.owner){ S.blocked=Array.from(new Set((S.blocked||[]).concat(item.owner))).slice(-200); saveState(); await savePrefs(); }
      ui.inbox=(ui.inbox||[]).filter(x=>x.id!==id); ui.notice=block?`${item?item.name:'그 자'}를 차단했다. 다시는 결투장을 못 던진다.`:'결투장을 찢어버렸다.'; render();
    }catch(error){ ui.notice=reason(error); render(); }
  }
  async function savePrefs(){
    try{ const db=await ready, uid=firebase.auth().currentUser.uid; await db.collection('prefs').doc(uid).set({noInvite:!!S.noInvite,blocked:(S.blocked||[]).slice(-200)}); }
    catch(error){ console.warn('설정 저장 실패',error&&error.code||error); }
  }
  async function setNoInvite(on){ S.noInvite=!!on; saveState(); if(on) ui.inbox=[]; render(); await savePrefs(); }
  async function unblockAll(){ S.blocked=[]; saveState(); render(); await savePrefs(); }
  const isLocked=action=>!!S.pendingDuel&&['roll','reset','buy','wear','rename'].includes(action); // 연습 결투는 아무것도 안 바뀌니 대기 중에도 가능
  // 이긴 사람(결투장을 받은 쪽)이 진 사람을 살려줄지 기록 (한 번만)
  async function mercy(id,spare){
    try{ const db=await ready; await db.collection('duels').doc(id).update({spared:!!spare}); }
    catch(error){ console.warn('자비 기록 실패',error&&error.code||error); }
  }
  window.DuelOnline={send,open,accept,decline,cancel,checkDuels,isLocked,pushHero,loadBoard,redeem,mercy,sendTo,declineId,setNoInvite,unblockAll};
  if(S.hero) pushHero(S.hero,true);
  ready.then(()=>{ const ad=((window.BLOOD_DUEL_SUPPORT||{}).admins)||[]; const u=firebase.auth().currentUser; if(u&&ad.includes(u.uid)){ ui.isAdmin=true; if(view==='card'&&ui.tab==='set') render(); } }).catch(()=>{});
  const match=/#(?:[^#]*&)?duel-id=([A-Za-z0-9]{20})/.exec(location.hash);
  if(match) open(match[1]);
  else checkDuels();
  window.addEventListener('focus',checkDuels);
  // 보낸 결투장을 실시간으로 지켜봄: 상대가 수락·거절하면 새로고침 없이 바로 결과로 넘어감
  let watchId=null, unwatch=null, duelReady=false;
  async function watch(){
    const id=S.pendingDuel||null;
    if(id===watchId) return;
    if(unwatch){ try{ unwatch(); }catch(e){} unwatch=null; }
    watchId=id; if(!id) return;
    try{
      const db=await ready; if(watchId!==id) return;
      unwatch=db.collection('duels').doc(id).onSnapshot(shot=>{
        const d=shot.exists?shot.data():null; if(!d||d.status==='pending') return;
        duelReady=true; checkDuels();
      },error=>console.warn('결투장 지켜보기 실패',error&&error.code||error));
    }catch(error){ console.warn('결투장 지켜보기 실패',error); }
  }
  setInterval(()=>{ watch(); if(duelReady&&view!=='battle'&&!ui.duelId&&S.pendingDuel){ checkDuels(); } if(!S.pendingDuel) duelReady=false; },2000);
  watch(); watchInbox();
  setTimeout(()=>{ loadKakao().catch(()=>{}); },4000); // 버튼 누를 때 바로 뜨게 미리 불러둠 (팝업 차단 방지)
})();
