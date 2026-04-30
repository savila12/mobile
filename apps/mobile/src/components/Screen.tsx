import { PropsWithChildren, ReactElement } from 'react';
import { RefreshControlProps, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const Screen = ({
  children,
  scroll = true,
  refreshControl,
}: PropsWithChildren<{ scroll?: boolean; refreshControl?: ReactElement<RefreshControlProps> }>) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b' }}>
      {scroll ? (
        <ScrollView
          alwaysBounceVertical={Boolean(refreshControl)}
          refreshControl={refreshControl}
          contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16, paddingTop: 16 }}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>{children}</View>
      )}
    </SafeAreaView>
  );
};
