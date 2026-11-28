export interface PublicationImageFiles {
  food: Blob
  expirationEvidence: Blob
}

export interface UploadedPublicationImages {
  foodImageUrl: string
  expirationImagePath: string
  expirationImageId: string
  cleanup(): Promise<void>
}

export interface ProductPublicationStorage {
  upload(uid: string, images: PublicationImageFiles): Promise<UploadedPublicationImages>
  readPrivateImage(path: string): Promise<Blob>
}
