import React, { useCallback, useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import xmpp from "../../xmpp";
import {
  TActiveRoomFilter,
  TMessageHistory,
  TUserChatRooms,
  useStoreState,
} from "../../store";
import { getPublicProfile, uploadFile } from "../../http";
import { TProfile } from "../Profile/types";
import BookmarkRemoveIcon from "@mui/icons-material/BookmarkRemove";
import { format, formatDistance, subDays } from "date-fns";
import * as DOMPurify from "dompurify";

import {
  MainContainer,
  Avatar,
  ChatContainer,
  MessageList,
  MessageInput,
  Conversation,
  ConversationList,
  Sidebar,
  Search,
  ConversationHeader,
  TypingIndicator,
  MessageModel,
} from "@chatscope/chat-ui-kit-react";
import { Message } from "../../componets/Chat/Messages/Message";
import { SystemMessage } from "../../componets/Chat/Messages/SystemMessage";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useParams, useHistory } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { MetaNavigation } from "../../componets/MetaNavigation/MetaNavigation";
import { defaultChats, ROOMS_FILTERS } from "../../config/config";

type IMessagePosition = {
  position: MessageModel["position"];
  type: string;
  separator?: string;
};

const getPosition = (
  arr: TMessageHistory[],
  message: TMessageHistory,
  index: number
) => {
  const previousJID = arr[index - 1]?.data.senderJID?.split("/")[0];
  const nextJID = arr[index + 1]?.data.senderJID?.split("/")[0];
  const currentJID = message.data.senderJID?.split("/")[0];

  let result: IMessagePosition = {
    position: "single",
    type: "single",
  };

  if (arr[index - 1] && message) {
    if (
      format(new Date(arr[index - 1]?.date), "dd") !==
      format(new Date(message.date), "dd")
    ) {
      result.separator = format(new Date(message.date), "EEEE, dd LLLL yyyy");
    }
  }

  if (previousJID !== currentJID && nextJID !== currentJID) {
    return result;
  }

  if (previousJID !== currentJID && nextJID === currentJID) {
    result.position = "first";
    result.type = "first";
    return result;
  }

  if (previousJID === currentJID && nextJID === currentJID) {
    result.position = "normal";
    result.type = "normal";
    return result;
  }

  if (
    previousJID === currentJID &&
    nextJID !== currentJID &&
    arr[index - 1]?.data.isSystemMessage === "false"
  ) {
    result.position = "single";
    result.type = "last";
    return result;
  }

  return result;
};

const filterChatRooms = (
  rooms: TUserChatRooms[],
  filter: TActiveRoomFilter
) => {
  if (filter === ROOMS_FILTERS.official) {
    return rooms.filter((item) => {
      const splitedJid = item?.jid?.split("@")[0];
      return defaultChats[splitedJid];
    });
  }
  return rooms;
};

export function ChatInRoom() {
  const messages = useStoreState((state) => state.historyMessages);
  const user = useStoreState((store) => store.user);
  const userChatRooms = useStoreState((store) => store.userChatRooms);
  const loaderArchive = useStoreState((store) => store.loaderArchive);
  const currentUntrackedChatRoom = useStoreState(
    (store) => store.currentUntrackedChatRoom
  );
  const [profile, setProfile] = useState<TProfile>();
  const [myMessage, setMyMessage] = useState("");
  const [showMetaNavigation, setShowMetaNavigation] = useState(true);

  const [currentRoom, setCurrentRoom] = useState("");
  const [roomData, setRoomData] = useState<{
    jid: string;
    name: string;
    room_background: string;
    room_thumbnail: string;
    users_cnt: string;
  }>({
    jid: "",
    name: "",
    room_background: "",
    room_thumbnail: "",
    users_cnt: "",
  });
  const fileRef = useRef(null);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const [openDialog, setOpenDialog] = useState(false);
  const [showDialogTxt, setShowDialogTxt] = useState(false);
  const [dialogTxt, setDialogTxt] = useState<{
    headline: string;
    description: string;
  }>({ headline: "", description: "" });
  // @ts-ignore
  const { roomJID } = useParams();
  const history = useHistory();
  const [firstLoadMessages, setFirstLoadMessages] = useState(true);
  const activeRoomFilter = useStoreState((state) => state.activeRoomFilter);
  const setActiveRoomFilter = useStoreState(
    (state) => state.setActiveRoomFilter
  );
  const openLastMetaRoom = activeRoomFilter === ROOMS_FILTERS.meta;

  const onDrop = useCallback(
    (acceptedFiles) => {
      sendFile(acceptedFiles[0]);
    },
    [roomData]
  );

  const { getRootProps } = useDropzone({
    onDrop,
    noClick: true,
    maxFiles: 1,
  });
  const onYReachStart = () => {
    const filteredMessages = messages.filter(
      (item: any) => item.roomJID === currentRoom
    );

    if (loaderArchive) {
      return;
    } else {
      const lastMessageID = filteredMessages[0].id;
      xmpp.getPaginatedArchive(currentRoom, String(lastMessageID), 10);
    }
  };

  useEffect(() => {
    if (roomJID) {
      loadMessages(roomJID);
      setShowMetaNavigation(true);
    }
  }, [roomJID]);

  useEffect(() => {
    getPublicProfile(user.walletAddress).then((result) => {
      setProfile(result.data.result);
    });
  }, []);

  const chooseRoom = (jid: string) => {
    history.push("/chat/" + jid.split("@")[0]);
    loadMessages(jid);
  };

  const loadMessages = (jid: string) => {
    setCurrentRoom(jid);
    const currentRoomData = userChatRooms.filter((e) => e.jid === jid)[0];
    setRoomData(currentRoomData);
    useStoreState.getState().clearCounterChatRoom(jid);
    useStoreState.getState().setCurrentUntrackedChatRoom(jid);

    const filteredMessages = messages.filter(
      (item: any) => item.roomJID === jid
    );
    setFirstLoadMessages(true);

    if (
      !loaderArchive &&
      filteredMessages.length <= 10 &&
      filteredMessages.length > 0
    ) {
      const lastMessageID = filteredMessages[0].id;
      xmpp.getPaginatedArchive(jid, String(lastMessageID), 50);
    }
  };

  const getConversationInfo = (roomJID: string) => {
    const messagesInRoom = messages
      .filter((item: any) => item.roomJID === roomJID)
      .slice(-1);
    if (loaderArchive && messagesInRoom.length <= 0) {
      return "Loading...";
    }

    if (messagesInRoom.length > 0) {
      return messagesInRoom[0].body;
    }
    return "No messages yet";
  };

  const getLastActiveTime = (roomJID: string) => {
    const messagesInRoom = messages
      .filter((item: any) => item.roomJID === roomJID)
      .slice(-1);
    if (messagesInRoom.length <= 0) {
      return "";
    }

    return format(new Date(messagesInRoom[0].date), "H:mm");

    // if (differenceInHours(new Date(), new Date(messagesInRoom[0].date)) > 1) {
    //   return format(new Date(messagesInRoom[0].date), "hh:mm");
    // } else {
    //   return formatDistance(
    //     subDays(new Date(messagesInRoom[0].date), 0),
    //     new Date(),
    //     { addSuffix: true }
    //   );
    // }
  };

  const stripHtml = (html: string) => {
    let doc: any;
    let str = html;

    str = str.replace(/<br>/gi, "\n");
    str = str.replace(/<p.*>/gi, "\n");
    str = str.replace(/<(?:.|\s)*?>/g, "");

    if (str.trim().length === 0) {
      doc = new DOMParser().parseFromString(html, "text/html");
    } else {
      doc = new DOMParser().parseFromString(str, "text/html");
    }
    return doc.body.textContent || "";
  };

  const sendMessage = (button: any) => {
    if (myMessage.trim().length > 0) {
      let userAvatar = "";
      if (profile?.profileImage) {
        userAvatar = profile?.profileImage;
      }
      const clearMessageFromHtml = DOMPurify.sanitize(myMessage);
      const finalMessageTxt = stripHtml(clearMessageFromHtml);

      if (finalMessageTxt.trim().length > 0) {
        xmpp.sendMessage(
          currentRoom,
          user.firstName,
          user.lastName,
          userAvatar,
          user.walletAddress,
          typeof button === "object" ? button.value : finalMessageTxt,
          typeof button === "object" ? button.notDisplayedValue : null
        );
      }
    }
  };

  const sendFile = (file: File) => {
    setDialogTxt({
      headline: "File is loading, please wait...",
      description: "",
    });
    setOpenDialog(true);

    const formData = new FormData();
    formData.append("files", file);

    uploadFile(formData)
      .then((result) => {
        let userAvatar = "";
        if (profile?.profileImage) {
          userAvatar = profile?.profileImage;
        }

        result.data.results.map(async (item: any) => {
          const data = {
            firstName: user.firstName,
            lastName: user.lastName,
            walletAddress: user.walletAddress,
            chatName: roomData.name,
            userAvatar: userAvatar,
            createdAt: item.createdAt,
            expiresAt: item.expiresAt,
            fileName: item.filename,
            isVisible: item.isVisible,
            location: item.location,
            locationPreview: item.locationPreview,
            mimetype: item.mimetype,
            originalName: item.originalname,
            ownerKey: item.ownerKey,
            size: item.size,
            duration: item?.duration,
            updatedAt: item.updatedAt,
            userId: item.userId,
            waveForm: "",
            attachmentId: item._id,
            wrappable: true,
          };
          xmpp.sendMediaMessageStanza(currentRoom, data);
          setOpenDialog(false);
        });
      })
      .catch((error) => {
        console.log(error);
        setDialogTxt({
          headline: "Error",
          description: "An error occurred while uploading the file",
        });
        setShowDialogTxt(true);
      });
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const setMessage = (value) => {
    setMyMessage(value);
    xmpp.isComposing(
      user.walletAddress,
      roomData.jid,
      user.firstName + " " + user.lastName
    );
  };

  const handlePaste = (event) => {
    // @ts-ignore
    let item = Array.from(event.clipboardData.items).find((x: any) =>
      /^image\//.test(x.type)
    );
    if (item) {
      // @ts-ignore
      let blob = item.getAsFile();
      sendFile(blob);
    }
  };

  const handleChatDetailClick = () => {
    history.push("/chatDetails/" + currentUntrackedChatRoom);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      xmpp.pausedComposing(user.walletAddress, roomData.jid);
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [myMessage]);

  useEffect(() => {
    if (currentUntrackedChatRoom) {
      if (
        !roomJID ||
        roomJID === "none" ||
        roomJID === "" ||
        currentUntrackedChatRoom.split("@")[0] === roomJID
      ) {
        if (currentUntrackedChatRoom.split("@")[1]) {
          chooseRoom(currentUntrackedChatRoom);
        } else {
          chooseRoom(currentUntrackedChatRoom + "@conference.dev.dxmpp.com");
        }
      }
    }

    if (
      currentUntrackedChatRoom.split("@")[0] !== roomJID &&
      roomJID !== "none" &&
      roomJID !== ""
    ) {
      useStoreState.getState().setCurrentUntrackedChatRoom(roomJID);
      chooseRoom(roomJID);
    }

    window.onblur = () => {
      useStoreState.getState().setCurrentUntrackedChatRoom("");
    };

    window.onfocus = () => {
      if (currentRoom) {
        useStoreState.getState().setCurrentUntrackedChatRoom(currentRoom);
        useStoreState.getState().clearCounterChatRoom(currentRoom);
      }
    };
  }, [currentRoom]);

  useEffect(() => {
    const filteredMessages = messages.filter(
      (item: any) => item.roomJID === currentRoom
    );

    if (
      !loaderArchive &&
      filteredMessages.length > 0 &&
      filteredMessages.length <= 51 &&
      currentRoom &&
      firstLoadMessages
    ) {
      const lastUpFilteredMessage = filteredMessages[0];

      if (
        filteredMessages.length >= 10 &&
        filteredMessages.length < 15 &&
        lastUpFilteredMessage.data.isSystemMessage
      ) {
        setFirstLoadMessages(false);
        xmpp.getPaginatedArchive(
          currentRoom,
          String(lastUpFilteredMessage.id),
          5
        );
      } else if (filteredMessages.length === 1) {
        setFirstLoadMessages(false);
        xmpp.getPaginatedArchive(
          currentRoom,
          String(lastUpFilteredMessage.id),
          50
        );
      }
    }
  }, [messages]);

  return (
    <Box style={{ paddingBlock: "20px", height: "100%" }}>
      <MainContainer responsive>
        <Sidebar position="left" scrollable={false}>
          <Search placeholder="Search..." />
          <ConversationList loading={loaderArchive}>
            {filterChatRooms(userChatRooms, activeRoomFilter).map((room) => (
              <Conversation
                active={room.jid === currentRoom}
                key={room.jid}
                unreadCnt={room.unreadMessages}
                onClick={() => chooseRoom(room.jid)}
                name={room.name}
                info={getConversationInfo(room.jid)}
                lastActivityTime={getLastActiveTime(room.jid)}
              >
                <Avatar
                  src={
                    room.room_background !== "none"
                      ? room.room_background
                      : "https://icotar.com/initials/" + room.name
                  }
                />
              </Conversation>
            ))}
          </ConversationList>
        </Sidebar>

        <div {...getRootProps()} style={{ width: "100%", height: "100%" }}>
          <ChatContainer>
            {!!roomData && (
              <ConversationHeader onClick={() => handleChatDetailClick()}>
                <ConversationHeader.Back />
                {messages.filter((item: any) => item.roomJID === currentRoom)
                  .length > 0 && (
                  <ConversationHeader.Content
                    userName={roomData.name}
                    info={
                      "Active " +
                      formatDistance(
                        subDays(
                          new Date(
                            messages
                              .filter(
                                (item: any) => item.roomJID === currentRoom
                              )
                              .slice(-1)[0].date
                          ),
                          0
                        ),
                        new Date(),
                        { addSuffix: true }
                      )
                    }
                  />
                )}
                <ConversationHeader.Actions>
                  <BookmarkRemoveIcon />
                </ConversationHeader.Actions>
              </ConversationHeader>
            )}
            <MessageList
              loadingMore={loaderArchive}
              onYReachStart={onYReachStart}
              disableOnYReachWhenNoScroll={true}
              typingIndicator={
                !!userChatRooms.filter((e) => e.jid === currentRoom)[0]
                  ?.composing && (
                  <TypingIndicator
                    style={{ opacity: ".6" }}
                    content={
                      userChatRooms.filter((e) => e.jid === currentRoom)[0]
                        ?.composing
                    }
                  />
                )
              }
            >
              {messages
                .filter((item: any) => item.roomJID === currentRoom)
                .map((message, index, arr) => {
                  const position = getPosition(arr, message, index);
                  if (message.data.isSystemMessage === "false") {
                    return (
                      <Message
                        key={message.id}
                        is={"Message"}
                        position={position}
                        message={message}
                        userJid={xmpp.client?.jid?.toString()}
                        buttonSender={sendMessage}
                        chooseDirectRoom={chooseRoom}
                      />
                    );
                  } else {
                    return (
                      <SystemMessage
                        key={message.id}
                        is={"Message"}
                        message={message}
                        userJid={xmpp.client?.jid?.toString()}
                      />
                    );
                  }
                })}
              {messages.length <= 0 ||
                (!currentRoom && (
                  <MessageList.Content
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      height: "100%",
                      textAlign: "center",
                      fontSize: "1.2em",
                    }}
                  >
                    {!loaderArchive ? (
                      <span>
                        {!currentRoom &&
                          "To get started, please select a chat room."}
                      </span>
                    ) : (
                      "Loading..."
                    )}
                  </MessageList.Content>
                ))}
              {!loaderArchive &&
                currentRoom &&
                messages.filter((item: any) => item.roomJID === currentRoom)
                  .length <= 0 && (
                  <MessageList.Content
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      height: "100%",
                      textAlign: "center",
                      fontSize: "1.2em",
                    }}
                  >
                    Message list is empty
                  </MessageList.Content>
                )}
            </MessageList>
            {!!roomData?.name && (
              <div is={"MessageInput"}>
                <MessageInput
                  onPaste={handlePaste}
                  placeholder="Type message here"
                  onChange={setMessage}
                  onSend={sendMessage}
                  onAttachClick={() => fileRef.current.click()}
                />
                <input
                  type="file"
                  name="file"
                  id="file"
                  onChange={(event) => sendFile(event.target.files[0])}
                  ref={fileRef}
                  style={{ display: "none" }}
                />
              </div>
            )}
          </ChatContainer>
        </div>
      </MainContainer>

      <Dialog
        fullScreen={fullScreen}
        open={openDialog}
        onClose={() => setOpenDialog(true)}
        aria-labelledby="responsive-dialog-title"
      >
        <DialogTitle id="responsive-dialog-title">
          {dialogTxt.headline}
        </DialogTitle>
        <DialogContent>
          {showDialogTxt && dialogTxt.description.length > 0 ? (
            <DialogContentText>{dialogTxt.description}</DialogContentText>
          ) : (
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        {showDialogTxt ? (
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)} autoFocus>
              Close
            </Button>
          </DialogActions>
        ) : null}
      </Dialog>
      <MetaNavigation
        open={showMetaNavigation || openLastMetaRoom}
        chatId={currentRoom.split("@")[0]}
        onClose={() => {
          setShowMetaNavigation(false);

          openLastMetaRoom && setActiveRoomFilter("");
        }}
      />
    </Box>
  );
}
