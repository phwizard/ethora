/*
Copyright 2019-2022 (c) Dappros Ltd, registered in England & Wales, registration number 11455432. All rights reserved.
You may not use this file except in compliance with the License.
You may obtain a copy of the License at https://github.com/dappros/ethora/blob/main/LICENSE.
Note: linked open-source libraries and components may be subject to their own licenses.
*/

import {observer} from 'mobx-react-lite';
import React, { useState} from 'react';
import {asyncStorageConstants} from '../../constants/asyncStorageConstants';
import {asyncStorageSetItem} from '../../helpers/cache/asyncStorageSetItem';
import {underscoreManipulation} from '../../helpers/underscoreLogic';
import {useStores} from '../../stores/context';
import {
  getUserRoomsStanza,
  leaveRoomXmpp,
  roomConfigurationForm,
  subscribeToRoom,
  unsubscribeFromChatXmpp,
} from '../../xmpp/stanzas';
import {RoomListItem} from './RoomListItem';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import Modal from 'react-native-modal';
import {Input, Text, View} from 'native-base';
import {
  commonColors,
  defaultChats,
  ROOM_KEYS,
  textStyles,
} from '../../../docs/config';
import {FlatList, StyleSheet, TouchableOpacity} from 'react-native';
import {deleteChatRoom} from '../realmModels/chatList';
import {useNavigation} from '@react-navigation/native';
import {ROUTES} from '../../constants/routes';
import {CreateNewChatButton} from '../Chat/CreateNewChatButton';

export const RoomList = observer(({roomsList}: any) => {
  const {chatStore, loginStore} = useStores();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [pickedChatJid, setPickedChatJid] = useState<string>('');
  const [newChatName, setNewChatName] = useState<string>('');
  const [movingActive, setMovingActive] = useState<boolean>(false);

  const manipulatedWalletAddress = underscoreManipulation(
    loginStore.initialData.walletAddress,
  );

  const sortedRoomsList = roomsList.sort(
    (a: any, b: any) =>
      chatStore.roomsInfoMap[a.jid]?.priority -
      chatStore.roomsInfoMap[b.jid]?.priority,
  );

  const onDragEnd = async (partialReorderedList: any) => {
    const partialListCopy = partialReorderedList.map(
      (item: any, index: number) => {
        chatStore.updateRoomInfo(item.jid, {priority: index});
        return {...item, priority: index};
      },
    );
    const restOfTheList = chatStore.roomList.filter(
      (item: any) => !partialListCopy.find((el: any) => item.jid === el.jid),
    );
    const fullRoomsList = partialListCopy.concat(restOfTheList);
    chatStore.setRooms(fullRoomsList);
    await asyncStorageSetItem(
      asyncStorageConstants.roomsListHashMap,
      chatStore.roomsInfoMap,
    );
  };

  const renameChat = (jid: string, name: string) => {
    setModalVisible(true);
    setPickedChatJid(jid);
    setNewChatName(name);
  };

  const leaveTheRoom = async (jid: string) => {
    leaveRoomXmpp(
      manipulatedWalletAddress,
      jid,
      loginStore.initialData.walletAddress,
      chatStore.xmpp,
    );
    unsubscribeFromRoom(jid);
    await deleteChatRoom(jid);
    chatStore.getRoomsFromCache();
  };

  const unsubscribeFromRoom = async (jid: string) => {
    unsubscribeFromChatXmpp(manipulatedWalletAddress, jid, chatStore.xmpp);
    chatStore.updateRoomInfo(jid, {muted: true});
  };

  const subscribeRoom = (jid: string) => {
    subscribeToRoom(jid, manipulatedWalletAddress, chatStore.xmpp);
    chatStore.updateRoomInfo(jid, {muted: false});
  };

  const toggleNotification = (value: boolean, jid: string) => {
    if (!value) {
      // unsubscribeFromChatXmpp(manipulatedWalletAddress, roomJID, chatStore.xmpp);
      // chatStore.updateRoomInfo(roomJID, {muted: true});
      unsubscribeFromRoom(jid);
    } else {
      subscribeRoom(jid);
    }
  };

  const toggleMovingChats = () => {
    setMovingActive(!movingActive);
  };

  const renameTheRoom = (jid: string, name: string) => {
    roomConfigurationForm(
      manipulatedWalletAddress,
      jid,
      {
        roomName: name,
      },
      chatStore.xmpp,
    );

    getUserRoomsStanza(manipulatedWalletAddress, chatStore.xmpp);
  };

  const setNewChatNameHandle = () => {
    if (newChatName) {
      renameTheRoom(pickedChatJid, newChatName);
      setNewChatName('');
      setPickedChatJid('');
    }
    setModalVisible(false);
  };

  return (
    <>
      <Modal
        animationIn={'slideInUp'}
        animationOut={'slideOutDown'}
        isVisible={modalVisible}
        onBackdropPress={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <Text fontFamily={textStyles.regularFont}>Change room name</Text>
          <Input
            _input={{
              maxLength: 20,
            }}
            margin={10}
            fontFamily={textStyles.regularFont}
            maxLength={128}
            value={newChatName}
            onChangeText={text => setNewChatName(text)}
            placeholder="Enter new chat name"
            placeholderTextColor={commonColors.primaryColor}
          />

          <TouchableOpacity
            onPress={setNewChatNameHandle}
            style={styles.modalButton}>
            <View
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                flex: 1,
              }}>
              <Text
                fontFamily={textStyles.semiBoldFont}
                style={{color: 'white'}}>
                Done editing
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
      <View
      bg={"#e9f1fd"}
      shadow="2"
       >
      <FlatList
        nestedScrollEnabled={true}
        data={sortedRoomsList}
        keyExtractor={(item: any) => `${item.jid}`}
        renderItem={({item, index}) => {
          return (
            <RoomListItem
              index={index}
              length={sortedRoomsList.length}
              counter={item.counter}
              jid={item.jid}
              name={item.name}
              participants={item.participants}
              key={item.jid}
            />
          );
        }}
      />
      </View>
    </>
  );
  // });
});

const styles = StyleSheet.create({
  modalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 20,
  },
  modalButton: {
    backgroundColor: commonColors.primaryColor,
    borderRadius: 5,
    height: hp('4.3'),
    padding: 4,
  },
});
