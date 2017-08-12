"use strict";



// ---------- Extensions ----------

Array.prototype.has = function(item) {
    return this.indexOf(item) > -1;
};


// ---------- RegexQuantifier ----------

var RegexQuantifier = function(regexString, greedy) {
    var validPattern = /(\*|\+|\?|{\d+}|{\d+,}|{\d+,\d+})\??/;

    if (!validPattern.test(regexString)) {
        throw new Error("Invalid regexString");
    }

    var _regexString = regexString;

    this.butAsFewAsPossible = function() {
        if (!greedy) {
            throw new Error("butAsFewAsPossible() can't be called on this quantifier")
        }
        return new RegexQuantifier(_regexString + "?", false);
    };

    this.regexString = function(){
        return _regexString;
    };
};

/**
 * Quantifier to match the preceding element zero or more times
 * @type {RegexQuantifier}
 */
RegexQuantifier.zeroOrMore = new RegexQuantifier("*", true);

/**
 * Quantifier to match the preceding element one or more times
 * @type {RegexQuantifier}
 */
RegexQuantifier.oneOrMore = new RegexQuantifier("+", true);

/**
 * Quantifier to match the preceding element once or not at all
 * @type {RegexQuantifier}
 */
RegexQuantifier.noneOrOne = new RegexQuantifier("?", true);

RegexQuantifier.exactly = function(times) {
    return new RegexQuantifier("{" + times + "}", false);
};

RegexQuantifier.atLeast = function(minimum) {
    return new RegexQuantifier("{" + minimum + ",}", true);
};

RegexQuantifier.noMoreThan = function(maximum) {
    return new RegexQuantifier("{0," + maximum + "}", true);
};

RegexQuantifier.between = function(minimum, maximum) {
    return new RegexQuantifier("{" + minimum + "," + maximum + "}", true);
};


// ---------- RegexOptions ----------

var RegexOptions = {
    GLOBAL_MATCH: "option-global-match",
    IGNORE_CASE: "option-ignore-case",
    MULTI_LINE: "option-multi-line"
};


// ---------- RegexBuilder ----------

var RegexBuilder = function () {
    var _openGroupCount = 0;
    var _regexString = "";



    // PRIVATE METHODS

    var makeSafeForRegex = function (text) {
        return text
            .replace("\\", "\\\\") // Make sure this always comes first!
            .replace("?", "\\?")
            .replace(".", "\\.")
            .replace("+", "\\+")
            .replace("*", "\\*")
            .replace("^", "\\^")
            .replace("$", "\\$")
            .replace("(", "\\(")
            .replace(")", "\\)")
            .replace("[", "\\[")
            .replace("]", "\\]")
            .replace("{", "\\{")
            .replace("}", "\\}")
            .replace("|", "\\|");
    };

    var makeSafeForCharacterClass = function (text) {
        // Replace ] with \]
        var result = text.replace("]", "\\]");

        // replace ^ with \^ if it occurs at the start of the string
        if (result.indexOf("^") === 0) {
            result = "\\" + result;
        }

        return result;
    };

    var addQuantifier = function (quantifier) {
        if (!quantifier) {
            return;
        }
        if (!(quantifier instanceof RegexQuantifier)) {
            throw new Error("quantifier must be a RegexQuantifier");
        }
        _regexString += quantifier.regexString();
    };

    var isString = function(s) {
        return typeof(s) === "string" || s instanceof String;
    };



    // BUILD METHOD

    this.buildRegex = function (options) {
        if (_openGroupCount === 1) {
            throw new Error("One group is still open");
        }
        if (_openGroupCount > 1) {
            throw new Error(_openGroupCount + " groups are still open");
        }

        var flags = "";
        if (options) {
            if (!(options instanceof Array)) {
                options = [options];
            }
            if (options.has(RegexOptions.GLOBAL_MATCH)) {
                flags += "g";
            }
            if (options.has(RegexOptions.IGNORE_CASE)) {
                flags += "i";
            }
            if (options.has(RegexOptions.MULTI_LINE)) {
                flags += "m";
            }
        }

        return new RegExp(_regexString, flags);
    };



    // CHARACTER MATCHES

    this.text = function (text, quantifier) {
        if (text === null || text === undefined || text.length === 0) {
            return this;
        }
        if (!isString(text)) {
            throw new Error("text must be a string");
        }
        return this.regexText(makeSafeForRegex(text), quantifier);
    };

    this.regexText = function (text, quantifier) {
        if (text === null || text === undefined || text.length === 0) {
            return this;
        }
        if (!isString(text)) {
            throw new Error("text must be a string");
        }
        if (!quantifier) {
            _regexString += text;
            return this;
        }

        return this
            .startNonCapturingGroup()
            .regexText(text)
            .endGroup(quantifier);
    };

    this.anyCharacter = function (quantifier) {
        _regexString += ".";
        addQuantifier(quantifier);
        return this;
    };

    this.whitespace = function (quantifier) {
        _regexString += "\\s";
        addQuantifier(quantifier);
        return this;
    };

    this.nonWhitespace = function (quantifier) {
        _regexString += "\\S";
        addQuantifier(quantifier);
        return this;
    };

    this.digit = function (quantifier) {
        _regexString += "\\d";
        addQuantifier(quantifier);
        return this;
    };

    this.nonDigit = function (quantifier) {
        _regexString += "\\D";
        addQuantifier(quantifier);
        return this;
    };

    this.letter = function (quantifier) {
        _regexString += "[a-zA-Z]";
        addQuantifier(quantifier);
        return this;
    };

    this.nonLetter = function (quantifier) {
        _regexString += "[^a-zA-Z]";
        addQuantifier(quantifier);
        return this;
    };

    this.uppercaseLetter = function (quantifier) {
        _regexString += "[A-Z]";
        addQuantifier(quantifier);
        return this;
    };

    this.lowercaseLetter = function (quantifier) {
        _regexString += "[a-z]";
        addQuantifier(quantifier);
        return this;
    };

    this.letterOrDigit = function (quantifier) {
        _regexString += "[a-zA-Z0-9]";
        addQuantifier(quantifier);
        return this;
    };

    this.nonLetterOrDigit = function (quantifier) {
        _regexString += "[^a-zA-Z0-9]";
        addQuantifier(quantifier);
        return this;
    };

    this.hexDigit = function (quantifier) {
        _regexString += "[0-9A-Fa-f]";
        addQuantifier(quantifier);
        return this;
    };

    this.uppercaseHexDigit = function (quantifier) {
        _regexString += "[0-9A-F]";
        addQuantifier(quantifier);
        return this;
    };

    this.lowercaseHexDigit = function (quantifier) {
        _regexString += "[0-9a-f]";
        addQuantifier(quantifier);
        return this;
    };

    this.nonHexDigit = function (quantifier) {
        _regexString += "[^0-9A-Fa-f]";
        addQuantifier(quantifier);
        return this;
    };

    this.wordCharacter = function (quantifier) {
        _regexString += "\\w";
        addQuantifier(quantifier);
        return this;
    };

    this.nonWordCharacter = function (quantifier) {
        _regexString += "\\W";
        addQuantifier(quantifier);
        return this;
    };

    this.anyCharacterFrom = function (characters, quantifier) {
        _regexString += "[" + makeSafeForCharacterClass(characters) + "]";
        addQuantifier(quantifier);
        return this;
    };

    this.anyCharacterExcept = function (characters, quantifier) {
        _regexString += "[^" + makeSafeForCharacterClass(characters) + "]";
        addQuantifier(quantifier);
        return this;
    };

    this.anyOf = function (textArray, quantifier) {
        if (textArray === null || textArray === undefined) {
            return this;
        }
        if (!(textArray instanceof Array)) {
            return this.text(textArray, quantifier);
        }
        if (textArray.length === 1) {
            return this.text(textArray[0], quantifier);
        }
        if (textArray.length > 1) {
            return this
                .startNonCapturingGroup()
                .regexText(textArray
                    .map(function(t){
                        return makeSafeForRegex(t);
                    })
                    .join("|")
                )
                .endGroup(quantifier);
        }

        return this;
    };



    // ANCHORS (ZERO-WIDTH ASSERTIONS)

    this.startOfString = function () {
        _regexString += "^";
        return this;
    };

    this.endOfString = function () {
        _regexString += "$";
        return this;
    };

    this.wordBoundary = function () {
        _regexString += "\\b";
        return this;
    };



    // GROUPING

    this.startGroup = function () {
        _regexString += "(";
        _openGroupCount++;
        return this;
    };

    this.startNonCapturingGroup = function () {
        _regexString += "(?:";
        _openGroupCount++;
        return this;
    };

    this.endGroup = function (quantifier) {
        if (_openGroupCount === 0) {
            throw new Error("Cannot call endGroup() until a group has been started with startGroup()");
        }
        _regexString += ")";
        _openGroupCount--;
        addQuantifier(quantifier);
        return this;
    };
};

