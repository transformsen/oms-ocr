export interface DMSUpload{
        file: File
        metadatas: Metadata[]
}

export interface File{
    bytes: string
    contentType: string
}

export interface Metadata{
    locationId: string
    locationName: string
    fieldArray: Field[]
}

export interface Field {
    id: number,
    fieldName: string,
    fieldValue: string
}