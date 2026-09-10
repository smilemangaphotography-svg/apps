import SwiftUI

@main
struct ShishaLoveMerchantApp: App {
    private let startURL = URL(string: "https://shishalove.eu/shishalove-merchant/?app=ios&build=111")!

    var body: some Scene {
        WindowGroup {
            ShishaLoveWebView(
                startURL: startURL,
                appUserAgent: "ShishaLoveMerchant/1.1.2 iOS"
            )
            .ignoresSafeArea(.keyboard)
            .background(Color.white)
        }
    }
}
