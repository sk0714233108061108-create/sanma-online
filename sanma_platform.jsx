// ═══════════════════════════════════════════════════════════════════
// 三麻 COMPETITIVE PLATFORM  – CRT aesthetic, multiplayer + stats
// ═══════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback, useRef } from "react";

// ────────────────────────────────────────────────
// STORAGE LAYER
// ────────────────────────────────────────────────
const DB = {
  async get(k,sh=true){try{const r=await window.storage.get(k,sh);return r?JSON.parse(r.value):null;}catch{return null;}},
  async set(k,v,sh=true){try{await window.storage.set(k,JSON.stringify(v),sh);}catch{}},
  async del(k,sh=true){try{await window.storage.delete(k,sh);}catch{}},
  async list(pfx,sh=true){try{const r=await window.storage.list(pfx,sh);return r?.keys||[];}catch{return[];}},
};

// ────────────────────────────────────────────────
// CRYPTO / SESSION
// ────────────────────────────────────────────────
async function hashPw(pw){
  const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(pw));
  return[...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
function uid6(){return Math.random().toString(36).slice(2,8).toUpperCase();}
const SES='sanma_ses';
const getSes=()=>{try{return JSON.parse(localStorage.getItem(SES));}catch{return null;}};
const setSes=u=>localStorage.setItem(SES,JSON.stringify(u));
const clrSes=()=>localStorage.removeItem(SES);

// ────────────────────────────────────────────────
// STATS HELPERS
// ────────────────────────────────────────────────
const mkStats=()=>({games:0,wins:0,agari:0,houju:0,ykm:{}});
const fmtPct=(n,d)=>d?((n/d)*100).toFixed(1)+'%':'─';

// ────────────────────────────────────────────────
// STYLES
// ────────────────────────────────────────────────
const S={
  app:{background:'#000900',fontFamily:"'Courier New',monospace",color:'#00ff41',minHeight:'100vh',
       display:'flex',flexDirection:'column',overflow:'hidden',userSelect:'none',position:'relative'},
  scan:{pointerEvents:'none',position:'fixed',inset:0,zIndex:9999,
        background:'repeating-linear-gradient(transparent,transparent 2px,rgba(0,0,0,.08) 2px,rgba(0,0,0,.08) 4px)'},
  scr:{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
       padding:20,gap:14,overflowY:'auto'},
  ttl:{fontSize:24,letterSpacing:8,textShadow:'0 0 14px #00ff41',fontWeight:'bold',textAlign:'center'},
  sub:{fontSize:10,color:'#00cc44',letterSpacing:4,textAlign:'center'},
  card:{border:'1px solid #004422',background:'rgba(0,18,0,.75)',padding:'12px 16px',
        borderRadius:3,width:'100%',boxSizing:'border-box',maxWidth:340},
  inp:{background:'transparent',border:'1px solid #00aa44',color:'#00ff41',
       fontFamily:"'Courier New',monospace",fontSize:13,padding:'8px 10px',width:'100%',
       boxSizing:'border-box',outline:'none',borderRadius:2,letterSpacing:1},
  btn:{background:'transparent',border:'2px solid #00ff41',color:'#00ff41',
       fontFamily:"'Courier New',monospace",fontSize:13,padding:'9px 0',cursor:'pointer',
       letterSpacing:2,textShadow:'0 0 6px #00ff41',boxShadow:'0 0 12px rgba(0,255,65,.2)',
       borderRadius:2,width:'100%',transition:'all .1s'},
  btnSm:{background:'transparent',border:'1px solid #00aa44',color:'#aaffcc',
         fontFamily:"'Courier New',monospace",fontSize:11,padding:'5px 12px',cursor:'pointer',
         letterSpacing:1,borderRadius:2},
  btnRed:{border:'1px solid #ff4444',color:'#ff6666'},
  btnGold:{border:'2px solid #ffcc00',color:'#ffdd44',textShadow:'0 0 6px #ffaa00',
           boxShadow:'0 0 10px rgba(255,200,0,.2)'},
  err:{color:'#ff5555',fontSize:10,textAlign:'center',letterSpacing:1},
  ok:{color:'#44ff88',fontSize:10,textAlign:'center',letterSpacing:1},
  row:{display:'flex',gap:8,width:'100%',maxWidth:340},
  sep:{borderTop:'1px solid #003311',width:'100%',maxWidth:340},
  label:{fontSize:9,color:'#00aa44',letterSpacing:2,marginBottom:2},
  val:{fontSize:13,color:'#ffdd55',letterSpacing:1},
  // stat table
  tbl:{width:'100%',borderCollapse:'collapse'},
  th:{fontSize:9,color:'#00aa44',padding:'3px 6px',textAlign:'left',borderBottom:'1px solid #003311',letterSpacing:1},
  td:{fontSize:11,color:'#aaffcc',padding:'4px 6px',borderBottom:'1px solid #001800'},
  tdR:{fontSize:11,color:'#ffdd55',padding:'4px 6px',borderBottom:'1px solid #001800',textAlign:'right'},
};

// ────────────────────────────────────────────────
// ▸ APP ROOT
// ────────────────────────────────────────────────
export default function App(){
  const[user,setUser]=useState(null);
  const[scr,setScr]=useState('loading');// loading|auth|home|lobby|game|stats|leaderboard
  const[gameArgs,setGameArgs]=useState(null);

  useEffect(()=>{
    (async()=>{
      const ses=getSes();
      if(ses){
        const u=await DB.get('user:'+ses.id);
        if(u){setUser({...ses,...u});setScr('home');return;}
      }
      setScr('auth');
    })();
  },[]);

  const login=u=>{setSes({id:u.id,displayName:u.displayName});setUser(u);setScr('home');};
  const logout=()=>{clrSes();setUser(null);setScr('auth');};
  const startGame=args=>{setGameArgs(args);setScr('game');};
  const endGame=async result=>{
    if(user&&result){
      const u=await DB.get('user:'+user.id)||{...user};
      const st=u.stats||mkStats();
      st.games++;
      if(result.playerWon)st.wins++;
      st.agari+=(result.agari||0);
      st.houju+=(result.houju||0);
      (result.yakuman||[]).forEach(y=>{st.ykm[y]=(st.ykm[y]||0)+1;});
      const nu={...u,stats:st};
      await DB.set('user:'+user.id,nu);
      setUser(nu);setSes({id:nu.id,displayName:nu.displayName});
    }
    setScr('home');
  };

  if(scr==='loading')return(
    <div style={S.app}><div style={S.scan}/><div style={S.scr}>
      <div style={{color:'#00ff41',fontSize:14,letterSpacing:4,animation:'blink 1s infinite'}}>LOADING...</div>
    </div></div>);

  return(
    <div style={S.app}>
      <div style={S.scan}/>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}@keyframes glow{0%,100%{text-shadow:0 0 10px #00ff41}50%{text-shadow:0 0 24px #00ff41,0 0 40px #00cc33}}@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}button:active{opacity:.7}input::placeholder{color:#004422}`}</style>
      {scr==='auth'&&<AuthScreen onLogin={login}/>}
      {scr==='home'&&<HomeScreen user={user} onLogout={logout} onPlay={startGame} onStats={()=>setScr('stats')} onLeaderboard={()=>setScr('leaderboard')} onLobby={()=>setScr('lobby')}/>}
      {scr==='lobby'&&<LobbyScreen user={user} onBack={()=>setScr('home')} onStartGame={startGame}/>}
      {scr==='game'&&<GameScreen user={user} args={gameArgs} onEnd={endGame}/>}
      {scr==='stats'&&<StatsScreen user={user} onBack={()=>setScr('home')}/>}
      {scr==='leaderboard'&&<LeaderboardScreen user={user} onBack={()=>setScr('home')}/>}
    </div>
  );
}

// ────────────────────────────────────────────────
// ▸ AUTH SCREEN
// ────────────────────────────────────────────────
function AuthScreen({onLogin}){
  const[tab,setTab]=useState('login');
  const[id,setId]=useState('');const[pw,setPw]=useState('');const[pw2,setPw2]=useState('');const[dn,setDn]=useState('');
  const[msg,setMsg]=useState('');const[busy,setBusy]=useState(false);

  const doLogin=async()=>{
    if(!id||!pw){setMsg('IDとパスワードを入力してください');return;}
    setBusy(true);setMsg('');
    const u=await DB.get('user:'+id.toLowerCase());
    if(!u){setBusy(false);setMsg('ユーザーが見つかりません');return;}
    const h=await hashPw(pw);
    if(h!==u.hash){setBusy(false);setMsg('パスワードが違います');return;}
    setBusy(false);onLogin(u);
  };

  const doRegister=async()=>{
    if(!id||!pw||!dn){setMsg('全て入力してください');return;}
    if(id.length<3||id.length>16){setMsg('IDは3〜16文字');return;}
    if(pw.length<6){setMsg('パスワードは6文字以上');return;}
    if(pw!==pw2){setMsg('パスワードが一致しません');return;}
    if(!/^[a-zA-Z0-9_]+$/.test(id)){setMsg('IDは英数字と_のみ');return;}
    setBusy(true);setMsg('');
    const exists=await DB.get('user:'+id.toLowerCase());
    if(exists){setBusy(false);setMsg('このIDは既に使われています');return;}
    const h=await hashPw(pw);
    const u={id:id.toLowerCase(),displayName:dn,hash:h,stats:mkStats(),createdAt:Date.now()};
    await DB.set('user:'+u.id,u);
    setBusy(false);onLogin(u);
  };

  return(
    <div style={S.scr}>
      <div style={{animation:'glow 2.5s infinite',...S.ttl}}>三麻 ONLINE</div>
      <div style={S.sub}>▌ SANMA COMPETITIVE PLATFORM ▐</div>
      <div style={{...S.card,maxWidth:300,animation:'slideUp .3s ease'}}>
        <div style={{display:'flex',gap:0,marginBottom:14}}>
          {['login','register'].map(t=>(
            <button key={t} style={{...S.btnSm,flex:1,borderBottom:tab===t?'2px solid #00ff41':'1px solid #003311',
              color:tab===t?'#00ff41':'#006622',background:'transparent',borderLeft:'none',borderRight:'none',borderTop:'none',borderRadius:0,letterSpacing:2,padding:'6px 0'}}
              onClick={()=>{setTab(t);setMsg('');}}>
              {t==='login'?'ログイン':'新規登録'}
            </button>
          ))}
        </div>
        {tab==='register'&&<div style={{marginBottom:10}}>
          <div style={S.label}>表示名</div>
          <input style={S.inp} placeholder="あなたの名前" maxLength={12} value={dn} onChange={e=>setDn(e.target.value)}/>
        </div>}
        <div style={{marginBottom:10}}>
          <div style={S.label}>プレイヤーID</div>
          <input style={S.inp} placeholder="英数字 (例: player123)" maxLength={16} value={id} onChange={e=>setId(e.target.value)} autoCapitalize="none"/>
        </div>
        <div style={{marginBottom:14}}>
          <div style={S.label}>パスワード</div>
          <input style={S.inp} type="password" placeholder="6文字以上" value={pw} onChange={e=>setPw(e.target.value)}/>
        </div>
        {tab==='register'&&<div style={{marginBottom:14}}>
          <div style={S.label}>パスワード確認</div>
          <input style={S.inp} type="password" placeholder="もう一度入力" value={pw2} onChange={e=>setPw2(e.target.value)}/>
        </div>}
        {msg&&<div style={{...S.err,marginBottom:8}}>{msg}</div>}
        <button style={S.btn} onClick={tab==='login'?doLogin:doRegister} disabled={busy}>
          {busy?'処理中...':(tab==='login'?'▶ ログイン':'▶ 登録する')}
        </button>
      </div>
      <div style={{fontSize:9,color:'#003311',letterSpacing:1}}>データはブラウザ共有ストレージに保存されます</div>
    </div>
  );
}

// ────────────────────────────────────────────────
// ▸ HOME SCREEN
// ────────────────────────────────────────────────
function HomeScreen({user,onLogout,onPlay,onStats,onLeaderboard,onLobby}){
  const st=user?.stats||mkStats();
  const rank1=st.wins;
  return(
    <div style={S.scr}>
      <div style={{...S.ttl,fontSize:18}}>▌ 三麻 ONLINE ▐</div>
      <div style={{...S.card,maxWidth:320,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{fontSize:13,color:'#aaffcc',letterSpacing:1}}>{user?.displayName||user?.id}</div>
          <div style={{fontSize:9,color:'#00aa44',letterSpacing:2}}>ID: {user?.id}</div>
        </div>
        <button style={{...S.btnSm,...S.btnRed}} onClick={onLogout}>ログアウト</button>
      </div>
      {/* クイックスタット */}
      <div style={{...S.card,maxWidth:320}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:6,textAlign:'center'}}>
          {[['対局',st.games],['勝利',st.wins],['和了',st.agari],['放銃',st.houju]].map(([l,v])=>(
            <div key={l}>
              <div style={{fontSize:9,color:'#00aa44',letterSpacing:1}}>{l}</div>
              <div style={{fontSize:16,color:'#ffdd55'}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginTop:8,textAlign:'center'}}>
          <div><div style={{fontSize:9,color:'#00aa44'}}>勝率</div><div style={{color:'#aaffcc',fontSize:13}}>{fmtPct(st.wins,st.games)}</div></div>
          <div><div style={{fontSize:9,color:'#00aa44'}}>放銃率</div><div style={{color:'#ff9988',fontSize:13}}>{fmtPct(st.houju,st.games)}</div></div>
        </div>
      </div>
      {/* メニュー */}
      <div style={{width:'100%',maxWidth:320,display:'flex',flexDirection:'column',gap:8}}>
        <button style={{...S.btn,...S.btnGold}} onClick={()=>onPlay({mode:'solo',userId:user.id})}>
          🎲 ソロ対戦 (vs CPU×2)
        </button>
        <button style={S.btn} onClick={onLobby}>
          ⚔️ マルチ対戦 (人間と対戦)
        </button>
        <div style={{...S.row,gap:8}}>
          <button style={{...S.btnSm,flex:1}} onClick={onStats}>📊 詳細成績</button>
          <button style={{...S.btnSm,flex:1}} onClick={onLeaderboard}>🏆 ランキング</button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// ▸ LOBBY SCREEN (マルチ対戦)
// ────────────────────────────────────────────────
function LobbyScreen({user,onBack,onStartGame}){
  const[rooms,setRooms]=useState([]);
  const[myRoom,setMyRoom]=useState(null);
  const[view,setView]=useState('list');// list|create|waiting
  const[roomName,setRoomName]=useState('');
  const[joinCode,setJoinCode]=useState('');
  const[msg,setMsg]=useState('');
  const pollRef=useRef(null);

  // ルーム一覧ポーリング
  useEffect(()=>{
    const poll=async()=>{
      const keys=await DB.list('room:');
      const all=await Promise.all(keys.map(k=>DB.get(k)));
      setRooms(all.filter(r=>r&&r.status==='waiting').sort((a,b)=>b.created-a.created));
    };
    poll();
    pollRef.current=setInterval(poll,2000);
    return()=>clearInterval(pollRef.current);
  },[]);

  // 自分のルームを監視してゲーム開始
  useEffect(()=>{
    if(!myRoom)return;
    const check=async()=>{
      const r=await DB.get('room:'+myRoom);
      if(!r)return;
      if(r.status==='starting'){
        clearInterval(pollRef.current);
        onStartGame({mode:'multi',roomId:myRoom,userId:user.id,room:r});
      }
    };
    const iv=setInterval(check,1000);
    return()=>clearInterval(iv);
  },[myRoom]);

  const createRoom=async()=>{
    const rn=(roomName.trim()||user.displayName+'の部屋').slice(0,20);
    const rid=uid6();
    const room={
      id:rid,name:rn,hostId:user.id,
      players:[{id:user.id,name:user.displayName,ready:false}],
      maxPlayers:3,status:'waiting',created:Date.now(),
    };
    await DB.set('room:'+rid,room);
    setMyRoom(rid);setView('waiting');
  };

  const joinRoom=async(rid)=>{
    const r=await DB.get('room:'+rid);
    if(!r||r.status!=='waiting'){setMsg('入室できません');return;}
    if(r.players.find(p=>p.id===user.id)){setMyRoom(rid);setView('waiting');return;}
    if(r.players.length>=r.maxPlayers){setMsg('満員です');return;}
    r.players.push({id:user.id,name:user.displayName,ready:false});
    await DB.set('room:'+rid,r);
    setMyRoom(rid);setView('waiting');
  };

  const leaveRoom=async()=>{
    if(!myRoom)return;
    const r=await DB.get('room:'+myRoom);
    if(r){
      if(r.hostId===user.id){await DB.del('room:'+myRoom);}
      else{r.players=r.players.filter(p=>p.id!==user.id);await DB.set('room:'+myRoom,r);}
    }
    setMyRoom(null);setView('list');
  };

  const startMulti=async()=>{
    const r=await DB.get('room:'+myRoom);
    if(!r)return;
    r.status='starting';
    await DB.set('room:'+myRoom,r);
  };

  // WAITING VIEW
  if(view==='waiting'){
    return <WaitingRoom roomId={myRoom} userId={user.id} onLeave={leaveRoom} onStart={startMulti} onStartGame={rid=>onStartGame({mode:'multi',roomId:rid,userId:user.id})}/>;
  }

  // LIST VIEW
  return(
    <div style={S.scr}>
      <div style={{...S.ttl,fontSize:16}}>▌ マルチ対戦ロビー ▐</div>
      <div style={{width:'100%',maxWidth:340,display:'flex',flexDirection:'column',gap:8}}>
        <div style={{...S.row}}>
          <input style={{...S.inp,flex:1}} placeholder="ルーム名（省略可）" value={roomName} onChange={e=>setRoomName(e.target.value)} maxLength={20}/>
          <button style={{...S.btnSm,whiteSpace:'nowrap'}} onClick={createRoom}>作成</button>
        </div>
        <div style={{...S.row}}>
          <input style={{...S.inp,flex:1}} placeholder="ルームコードで参加" value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} maxLength={6}/>
          <button style={{...S.btnSm,whiteSpace:'nowrap'}} onClick={()=>joinRoom(joinCode.toLowerCase())}>参加</button>
        </div>
        {msg&&<div style={S.err}>{msg}</div>}
        <div style={S.sep}/>
        <div style={{fontSize:9,color:'#00aa44',letterSpacing:2}}>── 募集中のルーム ──</div>
        {rooms.length===0?<div style={{fontSize:10,color:'#004422',textAlign:'center',padding:12}}>現在ルームはありません</div>:
         rooms.map(r=>(
          <div key={r.id} style={{...S.card,display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px'}}>
            <div>
              <div style={{fontSize:12,color:'#aaffcc'}}>{r.name}</div>
              <div style={{fontSize:9,color:'#006622'}}>CODE: {r.id.toUpperCase()} | {r.players.length}/{r.maxPlayers}人</div>
            </div>
            <button style={{...S.btnSm,opacity:r.players.length>=r.maxPlayers?.5:1}} onClick={()=>joinRoom(r.id)}>
              {r.players.length>=r.maxPlayers?'満員':'参加'}
            </button>
          </div>
         ))
        }
      </div>
      <button style={{...S.btnSm}} onClick={onBack}>← もどる</button>
    </div>
  );
}

// ────────────────────────────────────────────────
// ▸ WAITING ROOM
// ────────────────────────────────────────────────
function WaitingRoom({roomId,userId,onLeave,onStart,onStartGame}){
  const[room,setRoom]=useState(null);

  useEffect(()=>{
    const poll=async()=>{
      const r=await DB.get('room:'+roomId);
      if(!r){onLeave();return;}
      setRoom(r);
      if(r.status==='starting')onStartGame(roomId);
    };
    poll();
    const iv=setInterval(poll,1000);
    return()=>clearInterval(iv);
  },[roomId]);

  if(!room)return<div style={S.scr}><div style={{color:'#00ff41',animation:'blink 1s infinite'}}>接続中...</div></div>;

  const isHost=room.hostId===userId;
  const canStart=room.players.length>=2; // 2〜3人でスタート可（残りはCPU）

  return(
    <div style={S.scr}>
      <div style={{...S.ttl,fontSize:15}}>▌ {room.name} ▐</div>
      <div style={{fontSize:10,color:'#00aa44',letterSpacing:2}}>ROOM CODE: <span style={{color:'#ffdd55',fontSize:14}}>{roomId.toUpperCase()}</span></div>
      <div style={{...S.card,maxWidth:300}}>
        <div style={{fontSize:9,color:'#00aa44',letterSpacing:2,marginBottom:8}}>── プレイヤー ({room.players.length}/{room.maxPlayers}) ──</div>
        {room.players.map((p,i)=>(
          <div key={p.id} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #002200'}}>
            <span style={{color:'#aaffcc',fontSize:12}}>{p.name}</span>
            <span style={{fontSize:10,color:p.id===room.hostId?'#ffdd55':'#006622'}}>{p.id===room.hostId?'HOST':'PLAYER'}</span>
          </div>
        ))}
        {Array.from({length:room.maxPlayers-room.players.length}).map((_,i)=>(
          <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #001500',opacity:.4}}>
            <span style={{color:'#004422',fontSize:12}}>空き席</span>
            <span style={{fontSize:10,color:'#003311'}}>CPU</span>
          </div>
        ))}
      </div>
      <div style={{fontSize:9,color:'#006622',letterSpacing:1,textAlign:'center'}}>コードを共有して友達を招待: <b style={{color:'#ffdd55'}}>{roomId.toUpperCase()}</b></div>
      {isHost&&<button style={{...S.btn,maxWidth:280,...(canStart?{}:{opacity:.4})}} onClick={canStart?onStart:null}>
        {canStart?'▶ ゲーム開始（残りはCPU）':'2人以上集まったら開始可能'}
      </button>}
      {!isHost&&<div style={{fontSize:10,color:'#006622',animation:'blink 1s infinite'}}>ホストの開始を待っています...</div>}
      <button style={{...S.btnSm,...S.btnRed}} onClick={onLeave}>退室</button>
    </div>
  );
}

// ────────────────────────────────────────────────
// ▸ GAME SCREEN (ゲーム本体との橋渡し)
// ────────────────────────────────────────────────
function GameScreen({user,args,onEnd}){
  const[phase,setPhase]=useState('setup');
  const[result,setResult]=useState(null);
  const frameRef=useRef(null);

  // ゲーム終了メッセージを受け取る
  useEffect(()=>{
    const handler=e=>{
      if(e.data?.type==='sanma_result'){
        setResult(e.data.result);
        setPhase('done');
      }
    };
    window.addEventListener('message',handler);
    return()=>window.removeEventListener('message',handler);
  },[]);

  // ゲームHTMLを組み込む (blob URL)
  useEffect(()=>{
    if(phase!=='setup')return;
    setPhase('playing');
  },[]);

  if(phase==='done'||result){
    return(
      <div style={S.scr}>
        <div style={{...S.ttl,fontSize:16}}>▌ 対局結果 ▐</div>
        <div style={{...S.card,maxWidth:300,textAlign:'center'}}>
          <div style={{fontSize:20,color:result?.playerWon?'#00ff41':'#ff6644',letterSpacing:3,marginBottom:8}}>
            {result?.playerWon?'WIN！':'LOSE'}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
            <div><div style={{fontSize:9,color:'#00aa44'}}>和了</div><div style={{color:'#ffdd55',fontSize:16}}>{result?.agari||0}回</div></div>
            <div><div style={{fontSize:9,color:'#00aa44'}}>放銃</div><div style={{color:'#ff9988',fontSize:16}}>{result?.houju||0}回</div></div>
          </div>
          {result?.yakuman?.length>0&&<div style={{fontSize:10,color:'#ffcc00',marginBottom:6}}>
            役満: {result.yakuman.join(', ')}
          </div>}
        </div>
        <div style={{...S.row,maxWidth:300,gap:8}}>
          <button style={{...S.btn,flex:1}} onClick={()=>onEnd(result)}>ホームへ</button>
          <button style={{...S.btn,flex:1}} onClick={()=>{setResult(null);setPhase('setup');}}>もう一度</button>
        </div>
      </div>
    );
  }

  // ゲーム本体をiframe的に表示
  return <EmbeddedGame args={args} user={user} onResult={r=>{setResult(r);setPhase('done');}} onBack={()=>onEnd(null)}/>;
}

// ────────────────────────────────────────────────
// ▸ EMBEDDED GAME (組み込みゲームコンポーネント)
//   既存ゲームのロジックを呼び出し、結果を収集する
// ────────────────────────────────────────────────
function EmbeddedGame({args,user,onResult,onBack}){
  const[ready,setReady]=useState(false);
  const[agari,setAgari]=useState(0);
  const[houju,setHouju]=useState(0);
  const[yakuman,setYakuman]=useState([]);
  const[gameKey,setGameKey]=useState(0);

  // ゲームHTMLのURLを動的に生成
  // ゲーム結果を蓄積するためのグローバルフックを設定
  useEffect(()=>{
    // グローバルコールバックをセット（既存ゲームHTMLが呼び出す想定）
    window._sanmaGameCallback=(evt)=>{
      if(evt.type==='agari'){setAgari(a=>a+1);if(evt.isYakuman)setYakuman(y=>[...y,evt.yakuName]);}
      if(evt.type==='houju')setHouju(h=>h+1);
      if(evt.type==='gameEnd'){
        onResult({playerWon:evt.playerWon,agari:evt.agari,houju:evt.houju,yakuman:evt.yakuman||[]});
      }
    };
    setReady(true);
    return()=>{delete window._sanmaGameCallback;};
  },[]);

  return(
    <div style={{flex:1,display:'flex',flexDirection:'column',height:'100vh',position:'relative'}}>
      {/* ゲーム統計バー */}
      <div style={{background:'#000a00',borderBottom:'1px solid #003311',padding:'4px 10px',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
        <div style={{fontSize:9,color:'#006622'}}>{user?.displayName}</div>
        <div style={{display:'flex',gap:12,fontSize:9}}>
          <span style={{color:'#00cc44'}}>和了: <b style={{color:'#ffdd55'}}>{agari}</b></span>
          <span style={{color:'#00cc44'}}>放銃: <b style={{color:'#ff9988'}}>{houju}</b></span>
        </div>
        <button style={{...S.btnSm,...S.btnRed,padding:'2px 8px',fontSize:9}} onClick={onBack}>中断</button>
      </div>
      {/* ゲーム本体 (既存HTMLゲームを埋め込む想定) */}
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',background:'#000900'}}>
        <div style={{textAlign:'center',color:'#006622',fontSize:11}}>
          <div style={{fontSize:14,color:'#00ff41',letterSpacing:3,marginBottom:12}}>▌ ゲームエンジン ▐</div>
          <div style={{color:'#aaffcc',marginBottom:8}}>
            既存のゲーム（sanma_mahjong.html）を<br/>同じブラウザタブで開いてプレイしてください
          </div>
          <div style={{fontSize:9,color:'#003322',marginBottom:16}}>
            対局結果はこのプラットフォームに自動反映されます
          </div>
          {/* 手動入力で結果を記録するUI（デモ用） */}
          <ManualResultEntry agari={agari} houju={houju} onAgari={()=>setAgari(a=>a+1)} onHouju={()=>setHouju(h=>h+1)}
            onEnd={(won)=>onResult({playerWon:won,agari,houju,yakuman})}/>
        </div>
      </div>
    </div>
  );
}

// 手動対局入力フォーム（ゲームHTMLが別ファイルの場合の橋渡し）
function ManualResultEntry({agari,houju,onAgari,onHouju,onEnd}){
  const[mode,setMode]=useState('main');
  const[ykm,setYkm]=useState('');
  const YKM_LIST=['国士無双','天和','地和','四暗刻','大三元','大四喜','小四喜','字一色','清老頭','大車輪','緑一色'];
  return(
    <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'center',maxWidth:260}}>
      {mode==='main'&&<>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,width:'100%'}}>
          <button style={{...S.btnSm,padding:'10px 0',fontSize:12}} onClick={onAgari}>✓ 和了 ({agari})</button>
          <button style={{...S.btnSm,padding:'10px 0',fontSize:12,...S.btnRed}} onClick={onHouju}>✗ 放銃 ({houju})</button>
        </div>
        <button style={{...S.btnSm,padding:'8px 0',fontSize:11,width:'100%',borderColor:'#ffcc00',color:'#ffdd44'}} onClick={()=>setMode('ykm')}>役満を記録</button>
        <div style={{...S.sep,width:'100%'}}/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,width:'100%'}}>
          <button style={{...S.btn}} onClick={()=>onEnd(true)}>勝利で終了</button>
          <button style={{...S.btn,...S.btnRed,border:'2px solid #ff6644'}} onClick={()=>onEnd(false)}>敗北で終了</button>
        </div>
      </>}
      {mode==='ykm'&&<>
        <div style={{fontSize:9,color:'#ffcc00',letterSpacing:2}}>役満を選択</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:5,justifyContent:'center'}}>
          {YKM_LIST.map(y=><button key={y} style={{...S.btnSm,fontSize:10,padding:'5px 8px',borderColor:'#ffcc00',color:'#ffdd44'}}
            onClick={()=>{setYkm(y);setMode('main');}}>
            {y}
          </button>)}
        </div>
        <button style={{...S.btnSm}} onClick={()=>setMode('main')}>← キャンセル</button>
      </>}
    </div>
  );
}

// ────────────────────────────────────────────────
// ▸ STATS SCREEN
// ────────────────────────────────────────────────
function StatsScreen({user,onBack}){
  const st=user?.stats||mkStats();
  const ykEntries=Object.entries(st.ykm||{}).sort((a,b)=>b[1]-a[1]);
  const agariPct=fmtPct(st.agari,st.games);
  const houjuPct=fmtPct(st.houju,st.games);
  const winPct=fmtPct(st.wins,st.games);

  return(
    <div style={S.scr}>
      <div style={{...S.ttl,fontSize:16}}>▌ 詳細成績 ▐</div>
      <div style={{...S.sub}}>{user?.displayName}</div>
      {/* メイン統計 */}
      <div style={{...S.card,maxWidth:320}}>
        <table style={S.tbl}>
          <tbody>
            {[
              ['対局数',st.games,''],
              ['勝利数',st.wins,''],
              ['勝率',winPct,''],
              ['和了回数',st.agari,''],
              ['和了率 / 局',agariPct,''],
              ['放銃回数',st.houju,''],
              ['放銃率 / 局',houjuPct,''],
              ['役満上がり',Object.values(st.ykm||{}).reduce((a,b)=>a+b,0),''],
            ].map(([l,v])=>(
              <tr key={l}>
                <td style={S.th}>{l}</td>
                <td style={S.tdR}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* 役満一覧 */}
      {ykEntries.length>0&&<div style={{...S.card,maxWidth:320}}>
        <div style={{fontSize:9,color:'#ffcc00',letterSpacing:2,marginBottom:8}}>── 役満上がり履歴 ──</div>
        <table style={S.tbl}>
          <thead><tr><th style={S.th}>役名</th><th style={{...S.th,textAlign:'right'}}>回数</th></tr></thead>
          <tbody>
            {ykEntries.map(([name,cnt])=>(
              <tr key={name}>
                <td style={{...S.td,color:'#ffdd55'}}>{name}</td>
                <td style={S.tdR}>{cnt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}
      {ykEntries.length===0&&<div style={{fontSize:10,color:'#003322',textAlign:'center'}}>まだ役満の記録はありません</div>}
      <button style={{...S.btnSm}} onClick={onBack}>← もどる</button>
    </div>
  );
}

// ────────────────────────────────────────────────
// ▸ LEADERBOARD SCREEN
// ────────────────────────────────────────────────
function LeaderboardScreen({user,onBack}){
  const[players,setPlayers]=useState([]);
  const[loading,setLoading]=useState(true);
  const[sort,setSort]=useState('wins');

  useEffect(()=>{
    (async()=>{
      setLoading(true);
      const keys=await DB.list('user:');
      const all=await Promise.all(keys.map(k=>DB.get(k)));
      const valid=all.filter(Boolean).map(u=>({
        id:u.id,displayName:u.displayName||u.id,
        stats:u.stats||mkStats()
      }));
      setPlayers(valid);setLoading(false);
    })();
  },[]);

  const sorted=[...players].sort((a,b)=>{
    const sa=a.stats,sb=b.stats;
    if(sort==='wins')return sb.wins-sa.wins;
    if(sort==='games')return sb.games-sa.games;
    if(sort==='winPct')return(sb.games>0?sb.wins/sb.games:0)-(sa.games>0?sa.wins/sa.games:0);
    if(sort==='agariPct')return(sb.games>0?sb.agari/sb.games:0)-(sa.games>0?sa.agari/sa.games:0);
    return 0;
  });

  const sortBtns=[['wins','勝利数'],['games','対局数'],['winPct','勝率'],['agariPct','和了率']];

  return(
    <div style={S.scr}>
      <div style={{...S.ttl,fontSize:16}}>🏆 ランキング</div>
      <div style={{display:'flex',gap:4,flexWrap:'wrap',justifyContent:'center',maxWidth:340}}>
        {sortBtns.map(([k,l])=>(
          <button key={k} style={{...S.btnSm,padding:'4px 10px',
            borderColor:sort===k?'#00ff41':'#003311',color:sort===k?'#00ff41':'#006622'}}
            onClick={()=>setSort(k)}>{l}</button>
        ))}
      </div>
      {loading?<div style={{color:'#006622',animation:'blink 1s infinite',fontSize:11}}>読み込み中...</div>:
       sorted.length===0?<div style={{color:'#003322',fontSize:11}}>まだ登録者がいません</div>:
       <div style={{width:'100%',maxWidth:340,display:'flex',flexDirection:'column',gap:4}}>
        {sorted.map((p,i)=>{
          const st=p.stats;const isMe=p.id===user?.id;
          return(
            <div key={p.id} style={{...S.card,padding:'8px 12px',
              border:isMe?'1px solid #00ff41':'1px solid #003311',
              background:isMe?'rgba(0,40,0,.8)':'rgba(0,18,0,.7)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:14,color:i===0?'#ffdd00':i===1?'#aaaaaa':i===2?'#cc8844':'#004422',minWidth:22}}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</span>
                  <div>
                    <div style={{fontSize:12,color:isMe?'#00ff41':'#aaffcc'}}>{p.displayName}{isMe?<span style={{fontSize:8,color:'#00aa44'}}> (あなた)</span>:''}</div>
                    <div style={{fontSize:8,color:'#005522'}}>ID: {p.id}</div>
                  </div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:11,color:'#ffdd55'}}>{sort==='wins'?`${st.wins}勝`:sort==='games'?`${st.games}局`:sort==='winPct'?fmtPct(st.wins,st.games):fmtPct(st.agari,st.games)}</div>
                  <div style={{fontSize:8,color:'#006622'}}>{st.games}局 / {st.wins}勝</div>
                </div>
              </div>
              {/* 役満 */}
              {Object.keys(st.ykm||{}).length>0&&<div style={{fontSize:8,color:'#ffcc00',marginTop:4,borderTop:'1px solid #002200',paddingTop:4}}>
                役満: {Object.entries(st.ykm).map(([n,c])=>`${n}×${c}`).join(' / ')}
              </div>}
            </div>
          );
        })}
       </div>
      }
      <button style={S.btnSm} onClick={onBack}>← もどる</button>
    </div>
  );
}
