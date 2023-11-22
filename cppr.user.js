// ==UserScript==
// @name         CopyPromptPlusResponse
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Copy markdown representation of prompt and response on generative search systems.
// @author       danielsgriffin
// @match        https://www.perplexity.ai/search/*
// @match        https://you.com/search*
// @require      https://cdn.jsdelivr.net/npm/turndown@7.1.1/dist/turndown.js
// ==/UserScript==

(function () {
    'use strict';

    let perplexityMode = false;
    let youMode = false;

    // Create a new Turndown service
    const turndownService = new TurndownService();

    // Create a clickable icon
    const icon = document.createElement('button');
    icon.innerHTML = `<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 18px; color: white;">cppr</div><svg xmlns="http://www.w3.org/2000/svg" width=100% height=100% fill="currentColor" class="bi bi-clipboard2-fill" viewBox="0 0 16 16">
    <path d="M9.5 0a.5.5 0 0 1 .5.5.5.5 0 0 0 .5.5.5.5 0 0 1 .5.5V2a.5.5 0 0 1-.5.5h-5A.5.5 0 0 1 5 2v-.5a.5.5 0 0 1 .5-.5.5.5 0 0 0 .5-.5.5.5 0 0 1 .5-.5z"/>
    <path d="M3.5 1h.585A1.498 1.498 0 0 0 4 1.5V2a1.5 1.5 0 0 0 1.5 1.5h5A1.5 1.5 0 0 0 12 2v-.5c0-.175-.03-.344-.085-.5h.585A1.5 1.5 0 0 1 14 2.5v12a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 14.5v-12A1.5 1.5 0 0 1 3.5 1"/>
    </svg>`;
    // Existing styles
    icon.style.position = 'fixed';
    icon.style.cursor = 'pointer';
    icon.style.zIndex = '1000';
    icon.style.width = '75px';
    icon.style.padding = '0px';
    icon.style.background = 'transparent';
    icon.style.top = '50%';
    icon.style.left = '0';
    icon.style.transform = 'translate(0, -50%)';
    icon.title = 'Copy Prompt and Response';
    icon.setAttribute('aria-label', 'Copy Prompt and Response');

    // Additional styles to reset or override website styles
    icon.style.border = 'none'; // Removes any border
    icon.style.boxShadow = 'none'; // Removes any shadow
    icon.style.outline = 'none'; // Removes outline that might appear on focus
    icon.style.margin = '0'; // Resets margin
    // Add any other styles you want to reset or override

    // Get a close button
    const closeButton = createCloseButton()
    closeButton.style.background = 'none';
    closeButton.style.color = 'black';

    // Add event listener to close button
    closeButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Add this line to stop event propagation

        document.body.removeChild(icon);

        // Check if the promptSelectionDiv exists and remove it
        const promptSelectionDiv = document.querySelector('#prompt-selection-div');
        if (promptSelectionDiv !== null) {
            console.log("Removing promptSelectionDiv...");
            document.body.removeChild(promptSelectionDiv);
        } else {
            console.log("promptSelectionDiv not found.");
        }
    });

    icon.appendChild(closeButton);
    handleHoverBehavior(icon, closeButton);

    document.body.appendChild(icon);


    function announceCopyEvent() {
        // Create "Copied!" label
        console.log("in announceCopyEvent")
        const copiedLabel = document.createElement('div');
        copiedLabel.id = "announce-copy-event";
        copiedLabel.style.position = 'fixed';
        copiedLabel.style.top = '55%';
        copiedLabel.style.left = '50%';
        copiedLabel.style.padding = '10px';
        copiedLabel.style.transform = 'translate(-50%, -50%)';
        copiedLabel.style.color = 'white';
        copiedLabel.style.background = 'black';
        copiedLabel.style.fontSize = '80px';
        copiedLabel.style.borderRadius = '10px'; // Added this line to make the label slightly rounded
        copiedLabel.style.zIndex = '1000';
        copiedLabel.textContent = 'Copied!';
        
        document.body.appendChild(copiedLabel);

        // Remove label after 2 seconds
        setTimeout(() => {
            document.body.removeChild(copiedLabel);
        }, 2000);
    }

    async function getClipboardContents() {
        return await navigator.clipboard.readText();
    }

    async function writeCombinedTextToClipboard(prompt, response) {
        const combinedText = `# Prompt:\n${prompt}\n\n# Response\n${response}`;
        const unescapedCombinedText = combinedText.replace(/\\\[(\d+)\\\]/g, '[$1]');
        await navigator.clipboard.writeText(unescapedCombinedText);
    }


    // You.com specific
    function addYouFootnoteBrackets(string) {
        return string.replace(/(<span class="sc-51a47db1-0 sc-3690e738-0 dfZVVe gOsNCd">)(\d+)(<\/span>)/g, '$1[$2]$3');
    }

    // You.com specific
    function cleanYouCitations(responseDiv) {
        console.log("cppr note: cleanYouCitations function called.");
        // Convert string to DOM element
        const parser = new DOMParser();
        const doc = parser.parseFromString(responseDiv, 'text/html');
        // Find the div in body and then the last div in that div
        const lastChildDiv = doc.body.querySelector('div').lastElementChild;
        // Print the structure of doc to the console
        console.log(`cppr note: structure of doc: ${doc.documentElement.outerHTML}`);
        console.log(`cppr note: checking lastChildDiv: ${lastChildDiv.outerHTML}`)
        // Check if lastChildDiv contains citations
        const isCitationsDiv = Array.from(lastChildDiv.children).every(child =>
            child.tagName === 'A' && child.dataset.eventappname === 'click_on_citation'
        );

        console.log(`cppr note: isCitationsDiv is ${isCitationsDiv}`);

        if (!isCitationsDiv) {
            console.log("cppr note: cleanYouCitations found no citations in response.");
            return responseDiv;
        }

        // Extract citations
        const citationsArray = Array.from(lastChildDiv.children).map(a => ({
            citationURL: a.href,
            citationNum: a.querySelector('span:last-child').textContent
        }));

        console.log(`cppr note: citationsArray is ${JSON.stringify(citationsArray)}`);

        // Remove the original citations div
        lastChildDiv.remove();

        // Create a new citations div
        const citationsDiv = document.createElement('div');
        citationsDiv.id = 'citations-div';
        citationsDiv.innerHTML = '<span>Citations:</span><br>' +
            citationsArray.map(citation => `<span>[${citation.citationNum}] ${citation.citationURL}</span>`).join('<br>');

        // Combine the modified response with the new citations div
        let modifiedResponseDiv = `${doc.body.innerHTML}\n\n${citationsDiv.outerHTML}`;

        modifiedResponseDiv = addYouFootnoteBrackets(modifiedResponseDiv);

        console.log(`cppr note: modifiedResponseDiv is ${modifiedResponseDiv}`);

        return modifiedResponseDiv;
    }


    function findAllPromptResponsePairs() {
        let promptArray = [];
        if (window.location.href.startsWith('https://www.perplexity.ai')) {
            perplexityMode = true;
            const prompts = document.querySelectorAll('.break-words.whitespace-pre-line.default.font-display.text-3xl.font-regular.text-textMain.dark\\:text-textMainDark.selection\\:bg-superDuper.selection\\:text-textMain');
            const clipboardButtons = document.querySelectorAll('svg[data-icon="clipboard"]');       
            if (prompts.length > 0) {
                prompts.forEach((prompt, index) => {
                    promptArray.push({
                        prompt: prompt.innerText,
                        clipboardButton: clipboardButtons[index].closest('button')
                    });
                });
            }
        } else if (window.location.href.startsWith('https://you.com')) {
            youMode = true;
            let i = 0;
            const clipboardButtons = document.querySelectorAll('div[data-eventactiontitle="Copy Button"]');       

            while (true) {
                let div = document.querySelector(`div[data-testid="youchat-question-turn-${i}"]`);
                if (!div) break;
                promptArray.push({
                    prompt: div.innerText,
                    response: turndownService.turndown(cleanYouCitations(document.querySelector(`div[data-testid="youchat-answer-turn-${i}"]`).innerHTML))
                });
                i++;
            }
        }
        return promptArray;
    }
    function createCloseButton() {
        const closeButton = document.createElement('button');
        closeButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="25px" height="25px" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16">
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
        </svg>`;
        closeButton.style.width = '25px';
        closeButton.style.height = '25px';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '-25px';
        closeButton.style.right = '2px';
        closeButton.style.padding = 0;
        closeButton.style.margin = 0;
        closeButton.style.background = 'black';
        closeButton.style.color = 'white';
        closeButton.style.borderRadius = '10%';
        closeButton.style.border = 'none';
        closeButton.style.cursor = 'pointer';
        closeButton.title = 'Close'; // Basic browser tooltip
        closeButton.setAttribute('aria-label', 'Close');

        // Initially hide the close button
        closeButton.style.display = 'none';
        
        // Keep the close button displayed when the mouse is over it
        closeButton.addEventListener('mouseover', () => {
            closeButton.style.display = 'block';
        });


        return closeButton
    }

    function handleHoverBehavior(element, closeButton) {
        // Show the close button when the element is hovered
        element.addEventListener('mouseover', () => {
            closeButton.style.display = 'block';
        });
        // Hide the close button when the mouse leaves the element and is not over the close button
        element.addEventListener('mouseout', (event) => {
            if (!event.relatedTarget || event.relatedTarget !== closeButton) {
                closeButton.style.display = 'none';
            }
        });
    }

    function createPromptSelectionDiv() {
        const promptSelectionDiv = document.createElement('div');
        promptSelectionDiv.id = 'prompt-selection-div';
        promptSelectionDiv.style.position = 'fixed';
        promptSelectionDiv.style.top = '50%';
        promptSelectionDiv.style.left = '75px'; // To the right of the icon
        promptSelectionDiv.style.background = 'white';
        promptSelectionDiv.style.border = '3px solid black';
        promptSelectionDiv.style.borderRadius = '10px';
        promptSelectionDiv.style.zIndex = '1001'; // Higher than the icon
        promptSelectionDiv.style.color = 'white';
        promptSelectionDiv.style.padding = '5px';
        promptSelectionDiv.style.paddingTop = '10px';
        promptSelectionDiv.style.paddingBottom = '10px';

        // Get a close button
        const closeButton = createCloseButton()
        // Add event listener to close button
        closeButton.addEventListener('click', () => {
            document.body.removeChild(promptSelectionDiv);
        });

        // Append close button to the div
        promptSelectionDiv.appendChild(closeButton);
        handleHoverBehavior(promptSelectionDiv, closeButton);
        

        return promptSelectionDiv;

        
    }

    function createSelectAllButton(allPrompts, resolve) {
        const selectAllButton = document.createElement('button');
        selectAllButton.textContent = 'Select All';
        selectAllButton.style.padding = '5px';
        selectAllButton.style.margin = '5px';
        selectAllButton.style.background = 'black';
        selectAllButton.style.color = 'white';
        selectAllButton.style.borderRadius = '5px';
        selectAllButton.style.cursor = 'pointer';
        selectAllButton.style.border = 'none';

        selectAllButton.addEventListener('click', () => {
            console.log("Select All button clicked.");
            const promptSelectionDiv = document.querySelector('#prompt-selection-div');
            document.body.removeChild(promptSelectionDiv);
            resolve(allPrompts); // Resolve the Promise with all prompts
        });
        


        return selectAllButton;
    }
    function addHoverEffectToChildren(parentElement) {
        Array.from(parentElement.children).forEach(child => {
            child.addEventListener('mouseover', () => {
                child.style.background = '#404040';
            });
            child.addEventListener('mouseout', () => {
                child.style.background = 'black';
            });
        });
    }

    function createPromptElement(promptResponsePair, index) {
        const promptElement = document.createElement('p');
        promptElement.textContent = `${index + 1}. ${promptResponsePair.prompt}`;
        promptElement.style.cursor = 'pointer';
        promptElement.style.color = 'white';
        promptElement.style.background = 'black';
        promptElement.style.borderRadius = '10px';
        promptElement.style.padding = '5px';
        promptElement.style.margin = '5px';
        promptElement.style.border = 'none';

        return promptElement;
    }

    function getUserPromptSelection(allPrompts) {
        return new Promise((resolve) => {
            const promptSelectionDiv = createPromptSelectionDiv();

            // Add each prompt to the div
            allPrompts.forEach((promptResponsePair, index) => {
                const promptElement = createPromptElement(promptResponsePair, index);

                // On click, set the selected prompt, remove the div, and resolve the Promise
                promptElement.addEventListener('click', () => {
                    console.log("Prompt selected.")
                    const selectedPrompt = promptResponsePair;
                    console.log(`selectedPrompt: ${selectedPrompt}`)
                    document.body.removeChild(promptSelectionDiv);
                    resolve([selectedPrompt]); // Resolve the Promise with the selected prompt object
                });

                promptSelectionDiv.appendChild(promptElement);
            });

            // Add the Select All button to the div
            const selectAllButton = createSelectAllButton(allPrompts, resolve);
            promptSelectionDiv.appendChild(selectAllButton);
            addHoverEffectToChildren(promptSelectionDiv);
            // Add the div to the body
            document.body.appendChild(promptSelectionDiv);
        });
    }

    icon.addEventListener('click', async () => {
        // Check if the promptSelectionDiv exists and remove it and return if so.
        const existingPromptSelectionDiv = document.querySelector('#prompt-selection-div');
        if (existingPromptSelectionDiv !== null) {
            document.body.removeChild(existingPromptSelectionDiv);
            return;
        }

        let response = null
        console.log("Icon clicked!"); // Test if the event is triggered
        let allPrompts = findAllPromptResponsePairs();
        let selectedPromptResponsePairs;
        if (allPrompts.length === 0) {
            alert("No prompts found.");
        } else if (allPrompts.length > 1) {
            selectedPromptResponsePairs = await getUserPromptSelection(allPrompts);
        } else {
            selectedPromptResponsePairs = allPrompts;
        }


        let combinedText = '';
        for (const selectedPromptResponsePair of selectedPromptResponsePairs) {
            if (perplexityMode) {
                selectedPromptResponsePair.clipboardButton.click();
                response = await getClipboardContents();
            } else {
                response = selectedPromptResponsePair.response;
            }
            combinedText += `# Prompt:\n${selectedPromptResponsePair.prompt}\n\n# Response\n${response}\n\n`;
        }
        const unescapedCombinedText = combinedText.replace(/\\\[(\d+)\\\]/g, '[$1]');
        await navigator.clipboard.writeText(unescapedCombinedText);
        announceCopyEvent();
    });
    })
();
