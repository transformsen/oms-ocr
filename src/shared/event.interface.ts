export interface Event {
    effectiveDatetime: string
    classification: string
    description: string
    subjectAreaNm: string
    subjectSubAreaNm: string
    objNm: string
    srcSysCd: string
    eventPayload: EventPayLoad
}

export interface EventPayLoad{
    contentType: string
    contentEncoding: string
    name: string,
    extension: string
    payloadObject: PayLoadObject      
}

export interface Item{
    link: string
}

export interface OriginalRequestContext{
    description: string
}


export interface PayLoadObject{
    version: string
    mailProcessingJob: any
    addressee: Addressee
    item: Item
    originalRequestContext: OriginalRequestContext  
}

export interface Addressee{
    name: string
    address: Address
    wid: string
    ioi: string
}

export interface Address{
    line1: string
    line2: string
    city: string
    state: string
    zip: string
    zip4: string
}