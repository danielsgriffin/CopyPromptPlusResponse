# CopyPromptPlusResponse
A Userscript to Copy Search Prompts and Resulting Responses to Clipboard for Generative Search Tools

# Purpose
While it is standard for chatbot-style search systems to allow users to quickly copy the response from the model, the user may want to get a quick copy of both the prompt and response. Many such systems do allow the users to share the full conversation with others, but that may be much more information or in a less accessible form than desired by the system user. This is a simple demonstration of a Userscript (through [Tampermonkey](https://www.tampermonkey.net/)) that supports such interaction.

# Use
A 'cppr' clipboard sits at the left edge of the screen. The user can click the clipboard to either directly copy a single prompt-plus-response pair or select one or all such pairs from a simple menu. The Userscript then copies the prompt-plus-response pair(s) to the user's clipboard.

The pairs are stored in plain text in with markdown formatting, like the following:
```markdown
# Prompt:
what is a search query?

# Response:
A search...[1]

Citations:
[1] {url of citations #1}
```

Note: The prompts and responses for Metaphor Systems are different. They include the autoprompter output in the Prompt section and the Response is an ordered list of the search results with the title and URL.


# Systems Currently Supported

- Metaphor.com: https://metaphor.systems/ (note: not chatbot style at the time of this writing)
- Perplexity AI: https://www.perplexity.ai/
- You.com: https://you.com/

# Examples

Here is the cppr clipboard shown on Metaphor Systems (to the far left).
<img width="500" alt="image of ccpr at rest on Metaphor Systems" src="https://github.com/danielsgriffin/CopyPromptPlusResponse/assets/6070690/c4c40f7c-d2b3-43f9-a3b0-1b49b47c3067">

Clicking the cppr clipboard will copy the Prompt and Response to your Clipboard (if there is only one pair) or prompt the user to select one or all prompts & responses from their conversation.
<img width="500" alt="image of ccpr in action on You.com" src="https://github.com/danielsgriffin/CopyPromptPlusResponse/assets/6070690/681f6fca-7311-4931-bc17-35fd41fd330f">

Here is another example of cppr showing the prompts to select for copying:
<img width="500" alt="image of ccpr in action on Perplexity AI" src="https://github.com/danielsgriffin/CopyPromptPlusResponse/assets/6070690/cac648c4-f67c-4e0b-8293-3abd368a4446">

# ?
Please tell me if you have any questions or suggestions!
