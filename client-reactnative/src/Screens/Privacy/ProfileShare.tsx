import {Text} from 'native-base';
import React, {useMemo, useState} from 'react';
import {commonColors, textStyles} from '../../../docs/config';
import {SceneMap, TabBar, TabView} from 'react-native-tab-view';
import {widthPercentageToDP} from 'react-native-responsive-screen';
import {ProfileShareManage} from './ProfileShareManage';
import {ProfileShareAdd} from './ProfileShareAdd';

export interface IProfileShare {}

const renderTabBar = (props: any) => {
  return (
    <TabBar
      renderLabel={({route, focused}) => (
        <Text
          color={focused ? 'white' : 'info.200'}
          fontSize={14}
          fontFamily={textStyles.semiBoldFont}>
          {route.title}
        </Text>
      )}
      {...props}
      indicatorStyle={{backgroundColor: 'white'}}
      style={{backgroundColor: commonColors.primaryColor}}
    />
  );
};
const routes = [
  {key: 'manage', title: 'Manage'},
  {key: 'add', title: 'Add'},
];

export const ProfileShare = () => {
  const [routeIndex, setRouteIndex] = useState(0);
  const scene = useMemo(() => {
    return SceneMap({
      manage: () => <ProfileShareManage onAddPress={setRouteIndex} />,
      add: () => <ProfileShareAdd />,
    });
  }, [routeIndex]);

  return (
    <TabView
      swipeEnabled={false}
      renderTabBar={renderTabBar}
      navigationState={{
        index: routeIndex,
        routes: routes,
      }}
      renderScene={scene}
      onIndexChange={setRouteIndex}
      initialLayout={{width: widthPercentageToDP('100%')}}
    />
  );
};
