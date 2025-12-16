declare module 'react-facebook-login' {
    import { Component } from 'react'

    export interface ReactFacebookLoginInfo {
        id: string
        accessToken: string
        name?: string
        email?: string
        picture?: {
            data?: {
                url?: string
            }
        }
    }

    export interface ReactFacebookLoginState {
        isSdkLoaded?: boolean
        isProcessing?: boolean
    }

    export interface ReactFacebookLoginProps {
        appId: string
        autoLoad?: boolean
        callback: (userInfo: ReactFacebookLoginInfo) => void
        onFailure?: (error: any) => void
        fields?: string
        scope?: string
        returnScopes?: boolean
        redirectUri?: string
        state?: string
        responseType?: string
        cookie?: boolean
        xfbml?: boolean
        version?: string
        language?: string
        disableMobileRedirect?: boolean
        isMobile?: boolean
        isDisabled?: boolean
        tag?: string | Component<any>
        reAuthenticate?: boolean
        authType?: string
        cssClass?: string
        icon?: string | Component<any>
        containerId?: string
        textButton?: string
        typeButton?: string
        size?: string
        buttonStyle?: React.CSSProperties
        render?: (props: { onClick: () => void; isDisabled: boolean; isProcessing: boolean; isSdkLoaded: boolean }) => React.ReactElement
    }

    export default class FacebookLogin extends Component<ReactFacebookLoginProps, ReactFacebookLoginState> { }
}

