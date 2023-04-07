import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import Client from "../components/Client";
import Editor from "../components/Editor";
import { initSocket } from "../socket";
import ACTIONS from "../Actions";
import { Navigate, useLocation  , useNavigate, useParams} from "react-router-dom";
const EditorPage = () => {
  const socketRef = useRef(null);
  const location =useLocation();
  const {roomId} = useParams();
  
  const reactNavigator = useNavigate();
  const [clients, setClient] = useState([]);


  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();
      socketRef.current.on('connect_error', (err) => handleErrors(err));
      socketRef.current.on('connect_failed', (err) => handleErrors(err));

      function handleErrors(e){
        console.log('socket error', e);
        toast.error('socket connection failed, try again later.');
        reactNavigator('/');
      }
      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: location.state?.username,
      });
     
      //Listening for joined event 
      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients , username,socketId}) => {
          if(username !== location.state?.username){
            toast.success(`${username} joined the room`)
            console.log(`${username} joined`)
          }
         
          setClient(clients);

        }
        );

// Listening for disconected
   socketRef.current.on(
    ACTIONS.DISCONNECTED,
    ({socketId , username}) => {
      toast.success(`${username} left the room.`);
      setClient((prev) =>{
        return prev.filter(client => client.socketId !== socketId
      
          );
      })
    }
    )


    };
    init();
    return () => {
      socketRef.current?.disconnect();
      socketRef.current?.off(ACTIONS.JOINED);
      socketRef.current?.off(ACTIONS.DISCONNECTED);
    }

  }, []);

  async function copyRoomId(){
  try {
  await navigator.clipboard.writeText(roomId);
  toast.success('Room ID has been copied to your clipboard');
  } catch(err){
 toast.error('Could not copy the Room ID');
 console.error(err);
  }
}
 function leaveRoom(){
  reactNavigator('/');
 }

  
if (!location.state){
  return <Navigate to= "/" />;
}
  <Navigate/>
  return (
    <div className="mainWrap">
      <div className="aside">
        <div className="asideInner">
          <div className="logo">
            <img className="logoImage" src="/code-sync.png" alt="logo" />
          </div>
          <h3>Connected</h3>
          <div className="clientsList">
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>
        </div>

        <button className="btn copyBtn" onClick = {copyRoomId} > Copy ROOM ID </button>
        <button className="btn leaveBtn" onClick = {leaveRoom} >Leave</button>
      </div>
      <div className="editorWrap">
        <Editor socketRef={socketRef} roomId={roomId} />
      </div>
    </div>
  );
};

export default EditorPage;


