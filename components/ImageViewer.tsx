import ImageViewing from "react-native-image-viewing";

type ImageViewerProps = {
  images: { uri: string }[];
  imageIndex: number;
  visible: boolean;
  onRequestClose: () => void;
};

export default function ImageViewer(props: ImageViewerProps) {
  return <ImageViewing {...props} />;
}
