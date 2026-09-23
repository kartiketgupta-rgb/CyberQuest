const theoryData = {

    basics: {
        title: "🛡️ Cybersecurity Basics",

        content: `
            <p>
                Cybersecurity is the practice of protecting computers,
                networks, applications and data from unauthorized access,
                attacks, damage or disruption.
            </p>

            <h3>Why is Cybersecurity Important?</h3>

            <p>
                Modern systems store personal, financial and business
                information. A security incident can result in data theft,
                financial loss or service disruption.
            </p>

            <h3>Basic Security Practices</h3>

            <ul>
                <li>Use strong and unique passwords.</li>
                <li>Enable Multi-Factor Authentication.</li>
                <li>Keep software updated.</li>
                <li>Maintain secure backups.</li>
                <li>Be careful with suspicious messages and links.</li>
            </ul>

            <div class="highlight">
                💡 Cybersecurity is not only about technology.
                User awareness is also an important part of security.
            </div>
        `
    },


    passwords: {
        title: "🔐 Passwords & Multi-Factor Authentication",

        content: `
            <p>
                Passwords are commonly used to verify a user's identity,
                but passwords alone can be compromised through phishing,
                guessing, credential theft and data breaches.
            </p>

            <h3>Strong Passwords</h3>

            <p>
                Use long, unique passwords or passphrases and avoid reusing
                the same password across different services.
            </p>

            <h3>Password Manager</h3>

            <p>
                A password manager can generate and securely store
                unique passwords so users don't have to remember every
                password themselves.
            </p>

            <h3>Multi-Factor Authentication</h3>

            <p>
                MFA requires more than one type of authentication factor.
                These can include something you know, something you have,
                or something you are.
            </p>

            <div class="highlight">
                🔑 Example: Password + authenticator app is stronger
                than using a password alone.
            </div>
        `
    },


    phishing: {
        title: "🎣 Phishing & Social Engineering",

        content: `
            <p>
                Phishing is an attack where an attacker tries to trick
                a person into revealing sensitive information or interacting
                with a malicious link, file or website.
            </p>

            <h3>Common Phishing Methods</h3>

            <ul>
                <li>Email phishing</li>
                <li>SMS phishing (Smishing)</li>
                <li>Voice phishing (Vishing)</li>
                <li>Fake login pages</li>
                <li>Social media scams</li>
            </ul>

            <h3>Warning Signs</h3>

            <ul>
                <li>Unexpected messages</li>
                <li>Urgent or threatening language</li>
                <li>Suspicious links</li>
                <li>Requests for passwords or OTPs</li>
                <li>Offers that appear too good to be true</li>
            </ul>

            <div class="highlight">
                🎣 Never provide passwords, OTPs or sensitive information
                simply because a message asks for them.
            </div>
        `
    },


    malware: {
        title: "🦠 Malware & Ransomware",

        content: `
            <p>
                Malware is malicious software designed to damage systems,
                steal information, disrupt operations or gain unauthorized
                access.
            </p>

            <h3>Common Types</h3>

            <ul>
                <li><strong>Virus:</strong> Malicious code that can attach to files.</li>
                <li><strong>Worm:</strong> Malware that can spread between systems.</li>
                <li><strong>Trojan:</strong> Malicious software disguised as legitimate software.</li>
                <li><strong>Spyware:</strong> Software that secretly collects information.</li>
                <li><strong>Ransomware:</strong> Malware that can encrypt data and demand payment.</li>
            </ul>

            <h3>Protection</h3>

            <ul>
                <li>Keep software updated.</li>
                <li>Use security software.</li>
                <li>Avoid unknown downloads.</li>
                <li>Maintain protected backups.</li>
            </ul>
        `
    },


    network: {
        title: "🌐 Network Security",

        content: `
            <p>
                Network security protects devices, communications and
                network resources from unauthorized access and attacks.
            </p>

            <h3>Firewall</h3>

            <p>
                A firewall helps control network traffic according to
                security rules.
            </p>

            <h3>VPN</h3>

            <p>
                A VPN can create an encrypted connection between a device
                and a VPN service, helping protect network traffic from
                certain forms of interception.
            </p>

            <h3>Encryption</h3>

            <p>
                Encryption transforms readable information into a protected
                form so unauthorized people cannot easily understand it.
            </p>

            <div class="highlight">
                🌐 HTTPS uses encryption to help protect communication
                between a browser and a website.
            </div>
        `
    },


    web: {
        title: "💻 Web Security",

        content: `
            <p>
                Web security focuses on protecting websites and web
                applications from attacks and security weaknesses.
            </p>

            <h3>Common Web Security Risks</h3>

            <ul>
                <li>Broken Access Control</li>
                <li>Injection</li>
                <li>Security Misconfiguration</li>
                <li>Authentication Failures</li>
                <li>Vulnerable Components</li>
            </ul>

            <h3>SQL Injection</h3>

            <p>
                SQL injection occurs when untrusted input is incorrectly
                incorporated into database queries.
            </p>

            <h3>Cross-Site Scripting</h3>

            <p>
                XSS can occur when an application improperly handles
                untrusted content that is interpreted by a user's browser.
            </p>

            <div class="highlight">
                💻 OWASP maintains the OWASP Top 10 awareness document
                for major web application security risks.
            </div>
        `
    },


    privacy: {
        title: "🔒 Privacy & Safe Browsing",

        content: `
            <p>
                Online privacy means controlling how personal information
                is collected, used and shared.
            </p>

            <h3>Safe Browsing Practices</h3>

            <ul>
                <li>Check website addresses before entering information.</li>
                <li>Avoid suspicious downloads.</li>
                <li>Don't share unnecessary personal information.</li>
                <li>Review privacy settings.</li>
                <li>Be careful when using public Wi-Fi.</li>
            </ul>

            <div class="highlight">
                🔒 Think before you click, download or share.
            </div>
        `
    },


    backup: {
        title: "💾 Backups & Software Updates",

        content: `
            <p>
                Backups provide copies of important information that can
                be restored after accidental deletion, hardware failure
                or certain cyberattacks.
            </p>

            <h3>Why Updates Matter</h3>

            <p>
                Software updates can contain security fixes for known
                vulnerabilities.
            </p>

            <h3>Good Security Habits</h3>

            <ul>
                <li>Install security updates regularly.</li>
                <li>Keep operating systems updated.</li>
                <li>Maintain protected backups.</li>
                <li>Test whether backups can actually be restored.</li>
            </ul>

            <div class="highlight">
                💾 A backup is useful only when it can be recovered
                when you actually need it.
            </div>
        `
    }

};


function showTopic(topic) {

    const section =
        document.getElementById("theoryContent");

    const data = theoryData[topic];

    if (!data) return;

    section.innerHTML = `

        <h2>${data.title}</h2>

        ${data.content}

        <div style="
            margin-top:35px;
            padding-top:20px;
            border-top:1px solid rgba(255,255,255,.08);
        ">

            <p style="color:#67e8f9;">
                🎮 These concepts are used in CyberQuest quiz questions.
            </p>

        </div>
    `;

    section.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}