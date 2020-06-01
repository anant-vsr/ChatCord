import React from "react";
import { withRouter } from "react-router-dom";
import axios from "axios";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";
import IconButton from "@material-ui/core/IconButton";
import Icon from "@material-ui/core/Icon";
import "emoji-mart/css/emoji-mart.css";
import Picker from "emoji-picker-react";
import ReactEmoji from "react-emoji";

import Messages from "./messages/Messages";
import Input from "./input/Input";

import "./Conversation.css";

const Conversation = (props) => {
  const socket = props.socket;
  const [userId, setUserId] = React.useState("");
  const [messages, setMessages] = React.useState([]);
  const [msg, setMsg] = React.useState("");
  const [chosenEmoji, setChosenEmoji] = React.useState(null);
  const [isEmojiPickerVisibile, setIsEmojiPickerVisibile] = React.useState(
    false
  );

  const onEmojiClick = (event, emojiObject) => {
    setMsg(msg + emojiObject.emoji);
  };

  React.useEffect(() => {
    const token = localStorage.getItem("CC_Token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUserId(payload.id);
    }
    if (socket) {
      socket.on("newMessage", (message) => {
        console.log(message);
        const newMessages = [...messages, message];
        setMessages(newMessages);
      });
    }
  }, [messages]);

  React.useEffect(() => {
    //alert("mount");
    if (!socket) props.history.push("/");
    getOldMessages();
    if (socket) {
      socket.emit("joinRoom", {
        chatroomId: props.match.params.id,
      });
    }
    return () => {
      if (socket) {
        socket.emit("leaveRoom", {
          chatroomId: props.match.params.id,
        });
      }
    };
  }, [props.match.params.id]);

  React.useEffect(() => {
    if (props.leaveRoom != 0) leaveRoom();
  }, [props.leaveRoom]);

  const leaveRoom = () => {
    if (socket) {
      socket.emit("leaveRoom", {
        chatroomId: props.match.params.id,
      });
    }
  };

  const getOldMessages = () => {
    axios
      .get("http://localhost:8000/messages/" + props.match.params.id, {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("CC_Token"),
        },
      })
      .then((response) => {
        setMessages(response.data);
      })
      .catch((err) => {
        setTimeout(getOldMessages, 3000);
      });
  };

  const sendMessage = (event) => {
    if (event) event.preventDefault();
    if (socket) {
      socket.emit("newMessage", {
        chatroomId: props.match.params.id,
        message: msg,
      });
      setMsg("");
    }
  };

  return (
    <div className='outerContainer'>
      <div className='innerContainer'>
        <div className='emoji-picker'>
          {isEmojiPickerVisibile ? (
            <Picker onEmojiClick={onEmojiClick} />
          ) : null}
        </div>
        <Messages messages={messages} userId={userId} />
        <div className='sendMessageForm'>
          <form className='input' autoComplete='off'>
            <TextField
              className='messageInput'
              id='outlined-basic'
              type='text'
              name='message'
              placeholder='Type a message...'
              value={msg}
              variant='outlined'
              onChange={(e) => {
                setMsg(e.target.value);
              }}
              onKeyPress={(event) =>
                event.key === "Enter" ? sendMessage(event) : null
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment>
                    <IconButton
                      onClick={() =>
                        setIsEmojiPickerVisibile(!isEmojiPickerVisibile)
                      }
                    >
                      <Icon>emoji_emotions</Icon>
                    </IconButton>
                    <IconButton onClick={sendMessage}>
                      <Icon>send</Icon>
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </form>
        </div>
      </div>
      <div className='usersList'>
        <h1>Users list</h1>
      </div>
    </div>
  );
};

export default withRouter(Conversation);