import {
  FlatList,
  Image,
  Modal,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

type ImageViewerProps = {
  images: { uri: string }[];
  imageIndex: number;
  visible: boolean;
  onRequestClose: () => void;
};

export default function ImageViewer({
  images,
  imageIndex,
  visible,
  onRequestClose,
}: ImageViewerProps) {
  const { width, height } = useWindowDimensions();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onRequestClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          backgroundColor: "#000",
        }}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Close image viewer"
          onPress={onRequestClose}
          style={{ position: "absolute", top: 48, right: 20, zIndex: 1 }}
        >
          <Text style={{ color: "#fff", fontSize: 32 }}>×</Text>
        </TouchableOpacity>
        <FlatList
          data={images}
          horizontal
          pagingEnabled
          initialScrollIndex={imageIndex}
          keyExtractor={(item, index) => `${item.uri}-${index}`}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          renderItem={({ item }) => (
            <Image
              source={{ uri: item.uri }}
              resizeMode="contain"
              style={{ width, height }}
            />
          )}
        />
      </View>
    </Modal>
  );
}
