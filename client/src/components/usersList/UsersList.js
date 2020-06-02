import React from "react";
import Icon from "@material-ui/core/Icon";

import "./UsersList.css";

const UsersList = ({ onlineUsers }) => {
  return (
    <div className='usersListOuterContainer'>
      <span className='usersListHeading'>
        Curently available in this channel
      </span>
      <div className='usersListInnerContainer'>
        {onlineUsers.users
          ? onlineUsers.users.map((user, i) => (
              <div key={i} className='usersListOnlineUserInfo'>
                <Icon className='fas fa-circle' />
                <span>{user.username}</span>
              </div>
            ))
          : null}
      </div>
    </div>
  );
};

export default UsersList;