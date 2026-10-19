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
    const portrait=drawPortrait(hero,false).replace('<svg ','<svg x="54" y="88" width="340" height="425" ');
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
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png',.92));
      return blob?new File([blob],`${String(hero.name||'blood-duel').replace(/[^\w가-힣-]+/g,'-')}-결투장.png`,{type:'image/png'}):null;
    }catch(_){ return null; }
    finally{ URL.revokeObjectURL(source); }
  }

  async function send(copyOnly){
    if(!S.hero){ say('먼저 전사를 만들어 주세요.'); return; }
    if(sending) return;
    sending=true;
    try{
      const db=await ready;
      const uid=firebase.auth().currentUser.uid;
      const collection=db.collection('duels');
      const ref=S.pendingDuel?collection.doc(S.pendingDuel):collection.doc();
      if(!S.pendingDuel){
        await ref.set({version:1,status:'pending',ownerUid:uid,ownerHeroId:S.hero.id,
          challenger:packDuel(S.hero,ui.letter||''),createdAt:firebase.firestore.FieldValue.serverTimestamp()});
        S.pendingDuel=ref.id; saveState(); render();
      }else{
        const current=await ref.get();
        if(!current.exists||current.data().status!=='pending'){
          S.pendingDuel=null; saveState(); await checkDuels();
          say('이전 결투가 처리되었습니다. 결과를 확인한 뒤 다시 보내세요.'); return;
        }
        ui.letter=unpackDuel(current.data().challenger)?.letter||'';
      }
      remember(ref.id);
      const link=baseUrl()+'?invite='+ref.id+'#duel-id='+ref.id;
      const intro=`⚔ ${S.hero.name}의 결투 신청`+(ui.letter?`\n\n"${ui.letter}"`:'');
      const message=intro+`\n\n${link}`;
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
      if(!shot.exists){ say('결투장을 찾지 못했습니다.'); return; }
      const data=shot.data();
      if(data.status!=='pending'){
        clearLink();
        say('이미 종료된 결투장입니다.');
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
    const won=isOwner?result.winner==='B':result.winner==='A';
    const rep={me:clone(me),foe:opponent,log:isOwner?flipLog(result.log):result.log,
      win:won,broke:null,gain:null};
    if(won){ rep.gain=grow(me); rep.wins=me.wins; sync(me,true); }
    else{
      const last=result.log[result.log.length-1];
      sync(me,false);
      S.yard.unshift({name:me.name,g:me.g,cm:me.cm,outfit:me.outfit,wins:me.wins,
        cause:last?last.text:'전사'});
      S.yard=S.yard.slice(0,20); S.hero=null;
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
      const result={winner:outcome.winner,log:outcome.log};
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
      else say(error.message==='already-decided'?'이미 종료된 결투장입니다.':reason(error));
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
    }catch(error){ say(error.message==='already-decided'?'이미 종료된 결투장입니다.':reason(error)); }
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
      if(error.message==='already-decided'){ await checkDuels(); }
      else say(reason(error));
    }
  }
  const isLocked=action=>!!S.pendingDuel&&['roll','reset','accept','buy','wear','strip','unequip','rename'].includes(action);
  window.DuelOnline={send,open,accept,decline,cancel,checkDuels,isLocked};
  const match=/#(?:[^#]*&)?duel-id=([A-Za-z0-9]{20})/.exec(location.hash);
  if(match) open(match[1]);
  else checkDuels();
  window.addEventListener('focus',checkDuels);
})();
