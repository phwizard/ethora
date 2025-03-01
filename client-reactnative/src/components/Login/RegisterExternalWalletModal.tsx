/*
Copyright 2019-2022 (c) Dappros Ltd, registered in England & Wales, registration number 11455432. All rights reserved.
You may not use this file except in compliance with the License.
You may obtain a copy of the License at https://github.com/dappros/ethora/blob/main/LICENSE.
Note: linked open-source libraries and components may be subject to their own licenses.
*/

import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import Modal from 'react-native-modal';

import {commonColors, textStyles} from '../../../docs/config';
import {Input, TextField} from 'native-base';
import {useStores} from '../../stores/context';
export const RegisterExternalWalletModal = ({
  closeModal,
  modalVisible,
  walletAddress,
  message,
}: {
  closeModal: () => void;
  modalVisible: boolean;
  walletAddress: string;
  message: string;
}) => {
  const {loginStore} = useStores();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const onSubmit = async () => {
    setLoading(true);
    await loginStore.registerExternalWalletUser({
      walletAddress,
      msg: 'Registration',
      signature: message,
      loginType: 'signature',
      firstName,
      lastName,
    });
    setLoading(false);
  };
  return (
    <Modal onBackdropPress={closeModal} isVisible={modalVisible}>
      <View style={styles.modal}>
        <Input
          maxLength={15}
          marginBottom={2}
          fontFamily={textStyles.lightFont}
          fontSize={hp('1.6%')}
          color={'black'}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Enter your firtname"
          placeholderTextColor={commonColors.primaryColor}
        />
        <Input
          maxLength={15}
          fontFamily={textStyles.lightFont}
          fontSize={hp('1.6%')}
          color={'black'}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Enter your lastname"
          placeholderTextColor={commonColors.primaryColor}
        />
        <TouchableOpacity disabled={loading} style={styles.submitButton} onPress={onSubmit}>
          {loading ? (
            <ActivityIndicator size={20} color={'white'} />
          ) : (
            <Text style={{color: 'white'}}>Register</Text>
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: commonColors.primaryDarkColor,
    width: 150,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 10,
  },
});
