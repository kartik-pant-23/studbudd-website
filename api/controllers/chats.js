const Chat = require("../models/chat");

exports.getChats = async function(refId, skip, limit) {
    try {
        const chatData = await Chat.find({ reference: refId })
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .populate('assignment note examination');
        return chatData;
    } catch(err) {
        throw err;
    }
}

exports.insertChatItem = async function(data) {
    try {
        const chat = new Chat(data);
        const savedChat = await chat.save();
        return savedChat.populate('assignment note examination');
    } catch (err) {
        throw err;
    }
}