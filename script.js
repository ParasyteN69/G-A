const API_URL = "https://api.green-api.com";

const idInstanceInput = document.getElementById("idInstance");
const apiTokenInput = document.getElementById("apiTokenInstance");
const responseField = document.getElementById("response");

const getSettingsBtn = document.getElementById("getSettingsBtn");
const getStateInstanceBtn = document.getElementById("getStateInstanceBtn");
const sendMessageBtn = document.getElementById("sendMessageBtn");
const sendFileBtn = document.getElementById("sendFileBtn");

function getCredentials() {
    const idInstance = idInstanceInput.value.trim();
    const apiTokenInstance = apiTokenInput.value.trim();

    if (!idInstance || !apiTokenInstance) {
        throw new Error("Введите idInstance и ApiTokenInstance.");
    }

    return { idInstance, apiTokenInstance };
}

function showResponse(data) {
    if (typeof data === "string") {
        try {
            data = JSON.parse(data);
        } catch {
            responseField.value = data;
            return;
        }
    }

    responseField.value = JSON.stringify(data, null, 2);
}

function showError(error) {
    responseField.value = JSON.stringify({
        error: error.message || String(error)
    }, null, 2);
}

function buildUrl(method) {
    const { idInstance, apiTokenInstance } = getCredentials();

    return `${API_URL}/waInstance${encodeURIComponent(idInstance)}/${method}/${encodeURIComponent(apiTokenInstance)}`;
}

function normalizePhone(phone) {
    const digits = phone.replace(/\D/g, "");

    if (!digits) {
        throw new Error("Введите номер телефона.");
    }

    return `${digits}@c.us`;
}

async function request(method, options = {}) {
    responseField.value = "Выполняется запрос...";

    try {
        const response = await fetch(buildUrl(method), {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        });

        const text = await response.text();
        let data;

        try {
            data = text ? JSON.parse(text) : {};
        } catch {
            data = text;
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${
                typeof data === "string" ? data : JSON.stringify(data)
            }`);
        }

        showResponse(data);
        return data;
    } catch (error) {
        showError(error);
        throw error;
    }
}

async function runButton(button, action) {
    button.disabled = true;

    try {
        await action();
    } catch {
        // Ошибка уже выведена в поле ответа.
    } finally {
        button.disabled = false;
    }
}

getSettingsBtn.addEventListener("click", () => {
    runButton(getSettingsBtn, () => request("getSettings"));
});

getStateInstanceBtn.addEventListener("click", () => {
    runButton(getStateInstanceBtn, () => request("getStateInstance"));
});

sendMessageBtn.addEventListener("click", () => {
    runButton(sendMessageBtn, async () => {
        const phone = document.getElementById("messagePhone").value;
        const message = document.getElementById("messageText").value.trim();

        if (!message) {
            throw new Error("Введите текст сообщения.");
        }

        await request("sendMessage", {
            method: "POST",
            body: JSON.stringify({
                chatId: normalizePhone(phone),
                message: message
            })
        });
    });
});

sendFileBtn.addEventListener("click", () => {
    runButton(sendFileBtn, async () => {
        const phone = document.getElementById("filePhone").value;
        const url = document.getElementById("fileUrl").value.trim();
        const fileName = document.getElementById("fileName").value.trim();

        if (!url) {
            throw new Error("Введите URL файла.");
        }

        if (!/^https?:\/\//i.test(url)) {
            throw new Error("URL файла должен начинаться с http:// или https://.");
        }

        if (!fileName) {
            throw new Error("Введите имя файла с расширением, например horse.png.");
        }

        await request("sendFileByUrl", {
            method: "POST",
            body: JSON.stringify({
                chatId: normalizePhone(phone),
                urlFile: url,
                fileName: fileName
            })
        });
    });
});
