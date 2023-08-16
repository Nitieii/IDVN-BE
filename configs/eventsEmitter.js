/**
 * @param {Object} app express application
 * @param {Object} io socket.io
 */
const eventsEmitter = (app, io) => {
    app.on("Addform", (data) => {
        io.to(`${data.id}`).emit("Addform", data);
    });

    app.on("formUpdated", (data) => {
        io.to(`${data.id}`).emit("formUpdated", data);
    });

    app.on("Deleteform", (data) => {
        io.to(`${data.id}`).emit("Deleteform", data);
    });

    app.on("Addoption", (data) => {
        io.to(data.questionId).emit("Addoption", data);
    });

    app.on("optionUpdated", (data) => {
        io.to(data.questionId).emit("optionUpdated", data);
    });

    app.on("Deleteoption", (data) => {
        io.to(data.questionId).emit("Deleteoption", data);
    });

    app.on("questionUpdated", (data) => {
        io.to(data.formId).emit("questionUpdated", data);
    });

    app.on("Addquestion", (data) => {
        io.to(data.formId).emit("Addquestion", data);
    });

    app.on("Deletequestion", (data) => {
        io.to(data.formId).emit("Deletequestion", data);
    });

    app.on("Addmatter", (data) => {
        io.to(`${data.id}`).emit("Addmatter", data);
    });

    app.on("matterUpdated", (data) => {
        io.to(`${data.id}`).emit("matterUpdated", data);
    });

    app.on("Deletematter", (data) => {
        io.to(`${data.id}`).emit("Deletematter", data);
    });

    app.on("AddNoteMatter", (data) => {
        io.to(data.matterId).emit("AddNoteMatter", data);
    });

    app.on("UpdateNoteMatter", (data) => {
        io.to(data.matterId).emit("UpdateNoteMatter", data);
    });

    app.on("DeleteNoteMatter", (data) => {
        io.to(data.matterId).emit("DeleteNoteMatter", data);
    });

    app.on("Addtimseheet", (data) => {
        io.to(data.matterId).emit("Addtimseheet", data);
    });

    app.on("timesheetUpdated", (data) => {
        io.to(data.matterId).emit("timesheetUpdated", data);
    });

    app.on("Deletetimesheet", (data) => {
        io.to(data.matterId).emit("Deletetimesheet", data);
    });

    app.on("Addcomment", (data) => {
        io.to(data.PostId).emit("Addcomment", data);
    });

    app.on("commentUpdated", (data) => {
        io.to(data.PostId).emit("commentUpdated", data);
    });

    app.on("commentUpdatedNumLike", (data) => {
        io.to(data.PostId).emit("commentUpdatedNumLike", data);
    });

    app.on("Deletecomment", (data) => {
        io.to(data.PostId).emit("Deletecomment", data);
    });

    app.on("Addreply", (data) => {
        io.to(data.postId).emit("Addreply", data);
    });

    app.on("replyUpdated", (data) => {
        io.to(data.postId).emit("replyUpdated", data);
    });

    app.on("replyUpdatedNumLike", (data) => {
        io.to(data.postId).emit("replyUpdatedNumLike", data);
    });

    app.on("Deletereply", (data) => {
        io.to(data.postId).emit("Deletereply", data);
    });

    app.on("Addgroup", (data) => {
        io.to(`${data.id}`).emit("Addgroup", data);
    });

    app.on("groupUpdated", (data) => {
        io.to(`${data.id}`).emit("groupUpdated", data);
    });

    app.on("Deletegroup", (data) => {
        io.to(`${data.id}`).emit("Deletegroup", data);
    });

    app.on("Addpost", (data) => {
        io.to(data.groupID).emit("Addpost", data);
    });

    app.on("postUpdated", (data) => {
        io.to(data.groupID).emit("postUpdated", data);
    });

    app.on("postUpdatedNumLike", (data) => {
        io.to(`${data.id}`).emit("postUpdatedNumLike", data);
    });

    app.on("postUpdatedNumComment", (data) => {
        io.to(`${data.id}`).emit("postUpdatedNumComment", data);
    });

    app.on("DeletePost", (data) => {
        io.to(data.groupID).emit("DeletePost", data);
    });

    app.on("Addchecklis", (data) => {
        io.to(data.taskId).emit("Addchecklis", data);
    });

    app.on("checklistUpdated", (data) => {
        io.to(data.taskId).emit("checklistUpdated", data);
    });

    app.on("Deletechecklist", (data) => {
        io.to(data.taskId).emit("Deletechecklist", data);
    });

    app.on("Addnote", (data) => {
        io.to(data.taskId).emit("Addnote", data);
    });

    app.on("noteUpdated", (data) => {
        io.to(data.taskId).emit("noteUpdated", data);
    });

    app.on("Deletenote", (data) => {
        io.to(data.taskId).emit("Deletenote", data);
    });

    app.on("Addproject", (data) => {
        console.log("hereeee");
        io.to(`${data.id}`).emit("Addproject", data);
    });

    app.on("projectUpdated", (data) => {
        io.to(`${data.id}`).emit("projectUpdated", data);
    });

    app.on("projectUpdatedInfor", (data) => {
        io.to(`${data.id}`).emit("projectUpdatedInfor", data);
    });

    app.on("Deleteproject", (data) => {
        io.to(`${data.id}`).emit("Deleteproject", data);
    });

    app.on("Addstep", (data) => {
        io.to(data.projectId).emit("Addstep", data);
    });

    app.on("stepUpdated", (data) => {
        io.to(data.projectId).emit("stepUpdated", data);
    });

    app.on("DeleteStep", (data) => {
        io.to(data.projectId).emit("DeleteStep", data);
    });

    app.on("AddTask", (data) => {
        io.to(data.stepId).emit("AddTask", data);
    });

    app.on("taskUpdated", (data) => {
        io.to(data.stepId).emit("taskUpdated", data);
    });

    app.on("DeleteTask", (data) => {
        io.to(data.stepId).emit("DeleteTask", data);
    });

    app.on("userUpdated", (data) => {
        io.to(`${data.id}`).emit("userUpdated", data);
    });

    app.on("DeleteUser", (data) => {
        io.to(`${data.id}`).emit("DeleteUser", data);
    });

    app.on("SendMessage", (data) => {
        io.to(data.projectId).emit("SendMessage", data);
    });

    app.on("DeleteMessage", (data) => {
        io.to(data.projectId).emit("DeleteMessage", data);
    });

    app.on("SentImgChat", (data) => {
        io.to(data.projectId).emit("SentImgChat", data);
    });

    app.on("SendMessage", (data) => {
        io.to(`${data.projectId}`).emit("SendMessage", data);
    });

    app.on("sendNotification", (data) => {
        io.to(`${data.receiverId}`).emit("sendNotification", data);
    });

    app.on("SendInternalNotifications", (data) => {
        for (let i = 0; i < data.receiverId.length; i++) {
            io.to(data.receiverId[i]).emit("SendInternalNotifications", data);
        }
    });

    app.on("AddPlannedTasks", (data) => {
        io.to(data.teamId).emit("AddPlannedTasks", data);
    });
};

module.exports = eventsEmitter;
