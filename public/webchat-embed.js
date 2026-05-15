(() => {
	if (typeof window === "undefined") {
		return;
	}

	const DEFAULTS = {
		path: "/embed",
		title: "Chat",
		width: "380px",
		height: "520px",
		offset: "24px",
		position: "right",
		open: false,
		animationDurationMs: 240,
		closeLabel: "Close chat",
	};

	const applyStyles = (element, styles) => {
		Object.assign(element.style, styles);
	};

	const script = document.currentScript;

	if (!script || script.dataset.webchatInitialized === "true") {
		return;
	}

	script.dataset.webchatInitialized = "true";

	const scriptUrl = new URL(script.src, window.location.href);
	const origin = script.dataset.origin || scriptUrl.origin;
	const path = script.dataset.path || DEFAULTS.path;
	const frameUrl = new URL(path, origin).toString();
	const title = script.dataset.title || DEFAULTS.title;
	const width = script.dataset.width || DEFAULTS.width;
	const height = script.dataset.height || DEFAULTS.height;
	const offset = script.dataset.offset || DEFAULTS.offset;
	const position = script.dataset.position === "left" ? "left" : DEFAULTS.position;
	const startOpen = script.dataset.open === "true" || DEFAULTS.open;
	const animationDurationMs = DEFAULTS.animationDurationMs;
	const openLabel = title;
	const closeLabel = DEFAULTS.closeLabel;
	const isRightAligned = position === "right";
	const openIcon = `
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
			<path d="M8 10.5H16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
			<path d="M8 14H13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
			<path d="M12 3C7.02944 3 3 6.58172 3 11C3 13.0274 3.84814 14.8786 5.25 16.2941V21L9.05519 18.7163C9.97184 18.9007 10.9606 19 12 19C16.9706 19 21 15.4183 21 11C21 6.58172 16.9706 3 12 3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
		</svg>`;
	const closeIcon = `
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
			<path d="M6 6L18 18" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>
			<path d="M18 6L6 18" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>
		</svg>`;

	const root = document.createElement("div");
	root.setAttribute("data-webchat-root", "true");
	applyStyles(root, {
		position: "fixed",
		bottom: offset,
		zIndex: "2147483000",
		display: "flex",
		flexDirection: "column",
		alignItems: isRightAligned ? "flex-end" : "flex-start",
		gap: "12px",
	});
	root.style[position] = offset;

	const frame = document.createElement("iframe");
	frame.title = "Web chat";
	frame.loading = "eager";
	frame.allow = "clipboard-read; clipboard-write";
	applyStyles(frame, {
		display: "block",
		visibility: "hidden",
		width: `min(calc(100vw - 32px), ${width})`,
		height: `min(calc(100vh - 96px), ${height})`,
		border: "0",
		borderRadius: "24px",
		background: "transparent",
		boxShadow: "0 24px 80px rgba(0, 0, 0, 0.28)",
		opacity: "0",
		transform: "translateY(18px) scale(0.98)",
		transformOrigin: isRightAligned ? "bottom right" : "bottom left",
		transition: `opacity ${animationDurationMs}ms ease, transform ${animationDurationMs}ms ease`,
		pointerEvents: "none",
	});

	const button = document.createElement("button");
	button.type = "button";
	button.innerHTML = startOpen ? closeIcon : openIcon;
	button.setAttribute("aria-expanded", startOpen ? "true" : "false");
	button.setAttribute("aria-label", startOpen ? closeLabel : openLabel);
	button.title = startOpen ? closeLabel : openLabel;
	applyStyles(button, {
		border: "0",
		cursor: "pointer",
		borderRadius: "9999px",
		width: "52px",
		height: "52px",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		padding: "0",
		color: "#ffffff",
		background: "linear-gradient(135deg, #16a34a, #15803d)",
		boxShadow: "0 12px 32px rgba(22, 163, 74, 0.28)",
	});

	let hideTimer;
	let frameHasStartedLoading = false;
	let frameIsReady = false;
	let requestedOpen = startOpen;
	let hasRevealedFrame = false;

	const updateButtonState = (isOpen) => {
		button.innerHTML = isOpen ? closeIcon : openIcon;
		button.setAttribute("aria-expanded", isOpen ? "true" : "false");
		button.setAttribute("aria-label", isOpen ? closeLabel : openLabel);
		button.title = isOpen ? closeLabel : openLabel;
	};

	const clearHideTimer = () => {
		if (hideTimer) {
			window.clearTimeout(hideTimer);
			hideTimer = undefined;
		}
	};

	const notifyOpened = () => {
		window.setTimeout(() => {
			frame.contentWindow?.postMessage("webchat:opened", origin);
		}, animationDurationMs);
	};

	const revealFrame = () => {
		if (hasRevealedFrame) {
			return;
		}

		hasRevealedFrame = true;
		clearHideTimer();
		frame.style.visibility = "visible";
		frame.style.pointerEvents = "none";

		window.requestAnimationFrame(() => {
			frame.style.opacity = "1";
			frame.style.transform = "translateY(0) scale(1)";
			frame.style.pointerEvents = "auto";
			notifyOpened();
		});
	};

	const hideFrame = () => {
		hasRevealedFrame = false;
		clearHideTimer();
		frame.style.pointerEvents = "none";
		frame.style.opacity = "0";
		frame.style.transform = "translateY(18px) scale(0.98)";
		hideTimer = window.setTimeout(() => {
			frame.style.visibility = "hidden";
		}, animationDurationMs);
	};

	const ensureFrameLoaded = () => {
		if (frameHasStartedLoading) {
			return;
		}

		frameHasStartedLoading = true;
		frame.src = frameUrl;
	};

	const openWidget = () => {
		requestedOpen = true;
		updateButtonState(true);
		ensureFrameLoaded();

		if (frameIsReady) {
			revealFrame();
		}
	};

	const closeWidget = () => {
		requestedOpen = false;
		updateButtonState(false);
		hideFrame();
	};

	window.addEventListener("message", (event) => {
		if (event.origin !== origin || event.source !== frame.contentWindow) {
			return;
		}

		if (event.data !== "webchat:ready") {
			return;
		}

		frameIsReady = true;

		if (requestedOpen) {
			revealFrame();
		}
	});

	updateButtonState(startOpen);

	if (startOpen) {
		openWidget();
	}

	button.addEventListener("click", () => {
		if (requestedOpen) {
			closeWidget();
			return;
		}

		openWidget();
	});

	root.appendChild(frame);
	root.appendChild(button);
	document.body.appendChild(root);
})();
