import SwiftUI

@main
struct ShishaLoveCustomerApp: App {
    private let startURL = URL(string: "https://shishalove.eu/shishalove-app/?app=ios&build=100")!

    var body: some Scene {
        WindowGroup {
            ShishaLoveWebView(
                startURL: startURL,
                appUserAgent: "ShishaLoveCustomer/1.0 iOS"
            )
            .ignoresSafeArea(.keyboard)
            .background(Color.white)
        }
    }
}
