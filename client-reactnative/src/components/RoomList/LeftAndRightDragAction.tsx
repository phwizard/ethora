/*
Copyright 2019-2022 (c) Dappros Ltd, registered in England & Wales, registration number 11455432. All rights reserved.
You may not use this file except in compliance with the License.
You may obtain a copy of the License at https://github.com/dappros/ethora/blob/main/LICENSE.
Note: linked open-source libraries and components may be subject to their own licenses.
*/

import React from 'react';
import {View} from 'native-base';
import {StyleSheet, TouchableOpacity} from 'react-native';
import AntIcon from 'react-native-vector-icons/AntDesign';
import IonIcon from 'react-native-vector-icons/Ionicons';
import {commonColors, defaultChats} from '../../../docs/config';
import {useStores} from '../../stores/context';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {asyncStorageGetItem} from '../../helpers/cache/asyncStorageGetItem';
import {asyncStorageSetItem} from '../../helpers/cache/asyncStorageSetItem';
import {httpDelete} from '../../config/apiService';

interface LeftActionsProps {
  toggleNotification: any;
  swipeRef: any;
  jid: string;
  name: string;
  renameChat: any;
}

export const LeftActions = (props: LeftActionsProps) => {
  const {toggleNotification, swipeRef, name, jid, renameChat} = props;
  const {chatStore} = useStores();
  return (
    <>
      <TouchableOpacity
        onPress={() => {
          toggleNotification(chatStore.roomsInfoMap[jid].muted, jid);
          swipeRef.current.close();
        }}>
        <View style={[styles.swipeActionItem, {backgroundColor: 'grey'}]}>
          <IonIcon
            name={
              chatStore.roomsInfoMap[jid]?.muted
                ? 'notifications-off'
                : 'notifications'
            }
            size={hp('3%')}
            color={'white'}
          />
        </View>
      </TouchableOpacity>
      {chatStore.roomRoles[jid] !== 'participant' && (
        <TouchableOpacity
          onPress={() => {
            renameChat(jid, name);
            swipeRef.current.close();
          }}>
          <View
            style={[
              styles.swipeActionItem,
              {backgroundColor: commonColors.primaryDarkColor},
            ]}>
            <AntIcon color={'white'} size={hp('3%')} name={'edit'} />
          </View>
        </TouchableOpacity>
      )}
    </>
  );
};

interface RightActionsProps {
  jid: string;
  leaveChat: any;
  swipeRef: any;
}

export const RightActions = (props: RightActionsProps) => {
  const {jid, leaveChat, swipeRef} = props;
  const jidWithoutConference = jid?.split('@')[0];
  const {loginStore, apiStore} = useStores();
  const deleteMetaRoom = async () => {
    try {
      const res = await httpDelete(
        apiStore.defaultUrl + '/room' + jidWithoutConference,
      );
    } catch (error) {
      console.log(error);
    }
  };
  const onSwipeRight = async () => {
    leaveChat(jid);
    swipeRef.current.close();
    await deleteMetaRoom();
  };
  return (
    <>
      {!defaultChats[jidWithoutConference] && (
        <TouchableOpacity onPress={onSwipeRight}>
          <View style={[styles.swipeActionItem, {backgroundColor: 'red'}]}>
            <AntIcon color={'white'} size={hp('3%')} name={'delete'} />
          </View>
        </TouchableOpacity>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  swipeActionItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
    // borderRadius: 4
  },
});
