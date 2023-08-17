const express = require("express");
const cors = require("cors");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const compression = require("compression");
const helmet = require("helmet");
const mongoose = require("mongoose");
mongoose.set('strictQuery', false);

const {authenticateToken} = require("#middlewares");
const {eventsEmitter, routes, db, config} = require("#configs");

const {FileExternal, File, User, Img} = require("#models");
const {Project, Task, InternalNotification, TaskFile} =
    require("#models").project;
const {Message} = require("#models").chatRoom;
const {Post, Group} = require("#models").post;
const {Matter} = require("#models").matter;

const scheduler = require("./scheduler");

const app = express();

app.use(compression());
// Limit payload size
app.use(express.json({limit: "300kb"})); // body-parser defaults to a body size limit of 100kb
app.use(cors());

const http = require("http").createServer(app);
const io = require("socket.io")(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "DELETE"],
        // credentials: true
    },
});

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// against attack
app.use(helmet());

// scheduler.initCrons(config);
scheduler.dailyReminder();
scheduler.deadlineReminder();
scheduler.updateTaskStatus();

//Socket io
io.on("connection", (socket) => {
    socket.on("join", (id) => {
        socket.join(id);
        console.log("User joined", id);

        socket.emit("joined", `You has joined ${id}`);
    });

    socket.on("disconnect", () => {
        console.log(socket.id + " disconnected");
    });
});

eventsEmitter(app, io);

routes(app);

// Connect to mongodb
db();

// post file
const fs = require("fs");
const util = require("util");
const unlinkFile = util.promisify(fs.unlink);
const multer = require("multer");
const upload_file_internal = multer({dest: "files/file_internal/"});
const {
    uploadFile,
    getFileStream,
} = require("./controllers/file_internal/upload");

app.get("/api/files/internal/:key", (req, res) => {
    console.log(req.params);
    let key = req.params.key;
    let readStream = getFileStream(key);

    readStream.pipe(res);
});

app.post(
    "/api/files/upload_internal",
    authenticateToken,
    upload_file_internal.array("files"),
    async (req, res) => {
        const fileArr = [];
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];

            const result = await uploadFile(file);
            // await unlinkFile(file.path);
            console.log("result: ", result);

            const newfile = await File.create({
                title: req.files[i].originalname,
                path: result.Location,
                sharedPerson: req.body.sharedPerson,
                createBy: req.user.id,
                createdAt: moment().format(),
            });
            newfile.save();
            const files = await File.find();
            const fileOfPerson = [];
            for (let i = 0; i < files.length; i++) {
                const sharedPersonOfFile = files[i].sharedPerson;
                if (req.user.id === files[i].createBy) {
                    fileOfPerson.push(files[i]);
                } else {
                    for (let j = 0; j < sharedPersonOfFile.length; j++) {
                        if (req.user.id === sharedPersonOfFile[j]) {
                            fileOfPerson.push(files[i]);
                        }
                    }
                }
            }
            // const redisname = "fileOf" + req.user.id;
            // client.set(redisname, JSON.stringify(fileOfPerson));
            console.log("upload successfully: ", newfile);
            fileArr.push(newfile);
        }
        res.json({message: "uploaded", newfile: fileArr});
    }
);

// post file external
const upload_external = multer({dest: "files/file_external/"});
const {uploadFileEx} = require("./controllers/upload_external");

app.get("/api/files/external/:key", (req, res) => {
    console.log(req.params);
    let key = req.params.key;
    let readStream = getFileStream(key);

    readStream.pipe(res);
});

app.post(
    "/api/files/upload_external",
    authenticateToken,
    upload_external.single("file"),
    async (req, res) => {
        try {
            const file = req.file;
            const extendname = req.file.originalname.split(".").reverse()[0];
            const fileName = req.file.originalname.split(".").reverse()[1];
            const files_ex = await FileExternal.find({title: fileName});
            if (files_ex.length > 0) {
                return res.send({status: "error", message: "File is existed"});
            } else {
                const result = await uploadFileEx(file);

                let link = result.Location;
                const newLink = link.replace("%2B", "+");
                // await unlinkFile(file.path);
                const pdffile = fs.readFileSync(file.path);
                pdfparse(pdffile).then(async function (data) {
                    const newfileEx = await FileExternal.create({
                        title: fileName,
                        path: newLink,
                        createBy: req.user.id,
                        extension: extendname,
                        fileSize: req.file.size,
                        area: req.body.area,
                        content: data.text,
                        type: req.body.type,
                        createdAt: moment().format(),
                        badges: req.body.badges,
                        language: req.body.language,
                    });
                    newfileEx.save();
                    res.json({message: "uploaded", newfileEx: newfileEx});
                });
            }
        } catch (error) {
            return res.send({status: "error", message: error.message});
        }
    }
);

// post taskfile
const upload_taskfile = multer({dest: "files/taskfile/"});
const {uploadTaskfile} = require("./controllers/project/uploadtaskfile");

app.get("/api/task/:idtask/taskfiles/:key", (req, res) => {
    console.log(req.params);
    let key = req.params.key;
    let readStream = getFileStream(key);

    readStream.pipe(res);
});

app.post(
    "/api/task/:idtask/taskfiles/upload",
    authenticateToken,
    upload_taskfile.array("files"),
    async (req, res) => {
        const task = await Task.findById(req.params.idtask);
        const FileInTask = task.taskFiles;
        const fileArr = [];
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const result = await uploadTaskfile(file);
            await unlinkFile(file.path);
            console.log("result: ", result);
            const extendname = req.files[i].originalname.split(".").reverse()[0];
            const taskfile = await TaskFile.create({
                taskId: req.params.idtask,
                userId: req.user.id,
                title: req.files[i].originalname,
                path: result.Location,
                Size: req.files[i].size,
                type: extendname,
                userImg: req.user.image_url,
                createdAt: moment().format(),
            });
            console.log(" taskfile: ", taskfile);
            taskfile.save();
            fileArr.push(taskfile);
            FileInTask.push(taskfile);
            task.save();
        }
        console.log("upload successfully: ");
        console.log("fileArr: ", fileArr);
        res.json({message: "uploaded", taskfile: fileArr});
    }
);

// post document
const upload_document = multer({dest: "files/document/"});
const {uploadDocument} = require("./controllers/matter/upload_document");

app.get("/api/matter/:idmatter/document/:key", (req, res) => {
    console.log(req.params);
    let key = req.params.key;
    let readStream = getFileStream(key);

    readStream.pipe(res);
});

app.post(
    "/api/matter/:idmatter/document/upload",
    authenticateToken,
    upload_document.array("files"),
    async (req, res) => {
        const matter = await Matter.findById(req.params.idmatter);
        const docInMatter = matter.document;
        const docArr = [];
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];

            const result = await uploadDocument(file);
            await unlinkFile(file.path);
            console.log("result: ", result);
            const extendname = req.files[i].originalname.split(".").reverse()[0];
            const document = await File.create({
                matterId: req.params.idmatter,
                createBy: req.user.id,
                createByName: req.user.fullname,
                // user_img: req.user.image_url,
                title: req.files[i].originalname,
                path: result.Location,
                Size: req.files[i].size,
                type: extendname,
                createdAt: moment().format(),
            });
            document.save();
            docArr.push(document);

            docInMatter.push(document);
            matter.save();
        }
        console.log("upload successfully: ");
        res.json({message: "uploaded", document: docArr});
        console.log(req.files);
    }
);

// post img
const upload_imguser = multer({dest: "files/img_user/"});
const {upload_img_user} = require("./controllers/upload_img_user");

app.get("/api/user/:id/image/:key", (req, res) => {
    console.log(req.params);
    let key = req.params.key;
    let readStream = getFileStream(key);

    readStream.pipe(res);
});

app.post(
    "/api/user/:id/upload_img",
    authenticateToken,
    upload_imguser.single("file"),
    async (req, res) => {
        if (req.user.id === req.params.id) {
            const file = req.file;

            const result = await upload_img_user(file);
            await unlinkFile(file.path);
            console.log("result: ", result);
            const img = await Img.create({
                userId: req.user.id,
                path: result.Location,
            });
            img.save();
            const user = await User.findById(req.params.id);
            user.image_url = img.path;
            user.save();
            const postOfUser = user.posts;
            for (let i = 0; i < postOfUser.length; i++) {
                const post = await Post.findById(postOfUser[i]);
                post.userImg = img.path;
                post.save();
            }
            console.log("upload successfully: ", img);
            res.status(200).send({message: "uploaded", image: img});
        } else {
            console.log("Account does not have this permission");
            res.status(500).send({error: "Account does not this permission"});
        }
    }
);

// post img group
const upload_imggroup = multer({dest: "files/img_group/"});
const {uploadImgGroup} = require("./controllers/post/upload_img_group");

app.get("/api/group/:id/image/:key", (req, res) => {
    let key = req.params.key;
    let readStream = getFileStream(key);

    readStream.pipe(res);
});

app.post(
    "/api/group/:id/upload_img",
    authenticateToken,
    upload_imggroup.single("file"),
    async (req, res) => {
        const group = await Group.findById(req.params.id);
        const memberOfGroup = group.members;
        if (memberOfGroup.includes(req.user.id)) {
            const file = req.file;
            const result = await uploadImgGroup(file);
            await unlinkFile(file.path);

            const img = await Img.create({
                userId: req.user.id,
                path: result.Location,
                groupId: req.params.id,
            });
            group.ImgUrl = img.path;
            group.save();

            res.json({message: "uploaded", image: img});
        } else {
            console.log("Account does not have this permission");
            res.status(500).send({error: "Account does not this permission"});
        }
    }
);

// post img Chat
const upload_filechat = multer({dest: "files/file_chat/"});
const {uploadFileChat} = require("./controllers/ChatRoom/upload_file_chat");

app.post(
    "/api/project/:idproject/chat/upload_img",
    authenticateToken,
    upload_filechat.array("files"),
    async (req, res) => {
        try {
            const ArrImg = [];
            const project = await Project.findById(req.params.idproject);
            const receiverIds = project.assignedTo;

            if (req.user.role == "employee" || req.user.role == "admin") {
                const fileChatInProject = project.filesChat;
                for (let j = 0; j < req.files.length; j++) {
                    const file = req.files[j];
                    const result = await uploadFileChat(file);
                    await unlinkFile(file.path);

                    ArrImg.push(result.Location);
                    fileChatInProject.push(result.Location);
                }

                const message = await Message.create({
                    path: ArrImg,
                    projectId: req.params.idproject,
                    sentById: req.user.id,
                    sentBy: req.user.fullname,
                    SenderImg: req.user.image_url,
                    // typefile: extendname,
                    createdAt: moment().format(),
                });

                message.save();

                const MessageOfProject = project.messages;
                MessageOfProject.push(message);
                project.save();

                // if (receiverIds.includes(req.user.id)) {
                //   const indexOfSentUser = receiverIds.indexOf(req.user.id);
                //   receiverIds.splice(indexOfSentUser, 1);
                // }

                const noty = await InternalNotification.create({
                    content: `<b>${req.user.fullname}</b> has sent file(s) to the project: <b>${project.title}</b> chatroom`,
                    createdByImage: req.user.image_url,
                    projectId: project.id,
                    receiverId: receiverIds,
                    createdAt: moment().format(),
                });
                noty.save();

                for (let i = 0; i < receiverIds.length; i++) {
                    const user = await User.findById(receiverIds[i]);
                    const notiOfUser = user?.internalNotifications;
                    notiOfUser?.push(noty.id);
                    user.save();
                }
                // Emit event
                req.emit("SentImgChat", message);
                req.emit("SendInternalNotifications", noty);

                res.send({status: "success", message: message});
            } else {
                return res.send({
                    status: "error",
                    message: "User does not have the permission",
                });
            }
        } catch (err) {
            return res.send({status: "error", message: err.message});
        }
    }
);

// add post
const upload_img_post = multer({dest: "files/file_post/"});
const {uploadImgPost} = require("./controllers/post/upload_img_post");

// app.get("/api/group/:idgroup/posts/image/:key", (req, res) => {
//   console.log(req.params);
//   let key = req.params.key;
//   let readStream = getFileStream(key);

//   readStream.pipe(res);
// });

app.post(
    "/api/group/:idgroup/posts",
    authenticateToken,
    upload_img_post.array("files"),
    async (req, res) => {
        const {title, content} = req.body;
        const pathArr = [];
        if (req.files) {
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                const result = await uploadImgPost(file);
                await unlinkFile(file.path);
                pathArr.push(result.Location);
            }
        }
        try {
            const post = await Post.create({
                title,
                createdBy: req.user.id,
                createByName: req.user.fullname,
                userImg: req.user.image_url,
                content,
                groupID: req.params.idgroup,
                path: pathArr,
                createdAt: moment().format(),
            });
            console.log("Post added successfully: ", post);
            post.save();
            const group = await Group.findById(req.params.idgroup);

            const postOfGroup = group.posts;
            postOfGroup.push(post);
            group.save();
            // add post in schema user
            const user = await User.findById(req.user.id);
            const postOfUser = user.posts;
            postOfUser.push(post);
            user.save();
            // Emit event
            req.emit("Addpost", post);
            // const posts = await Post.find();
            // client.set("post", JSON.stringify(posts));
            return res.json({status: "create success", data: post});
        } catch (err) {
            res.status(500).send({msg: err.message});
        }
    }
);

app.post(
    "/api/posts/create",
    authenticateToken,
    upload_img_post.array("files"),
    async (req, res) => {
        const {title, content} = req.body;
        const pathArr = [];
        let postBanner = "";

        if (req.files) {
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                const result = await uploadImgPost(file);
                await unlinkFile(file.path);
                console.log("result: ", result);
                pathArr.push(result.Location);
            }
            postBanner = pathArr[0];
        } else {
            const bannerImgs = [
                "https://lnt-store-new.s3.us-east-2.amazonaws.com/document/unsplash_BRkikoNP0KQ.png",
                "https://lnt-store-new.s3.us-east-2.amazonaws.com/document/unsplash_E7w_Ti4BSSs.png",
                "https://lnt-store-new.s3.us-east-2.amazonaws.com/document/unsplash_EvKBHBGgaUo.png",
                "https://lnt-store-new.s3.us-east-2.amazonaws.com/document/unsplash_kKvQJ6rK6S4.png",
                "https://lnt-store-new.s3.us-east-2.amazonaws.com/document/unsplash_MJ_0PxIuquI.png",
                "https://lnt-store-new.s3.us-east-2.amazonaws.com/document/unsplash_Wm3DCN_ydR0.png",
            ];
            const ranNum = Math.floor(Math.random() * 6);
            postBanner = bannerImgs[ranNum];
        }

        try {
            const post = await Post.create({
                title,
                createdBy: req.user.id,
                createByName: req.user.fullname,
                userImg: req.user.image_url,
                postBanner: postBanner,
                content,
                path: pathArr,
                createdAt: moment().format(),
            });
            console.log("Post added successfully: ", post);
            post.save();
            // add post in schema user
            const user = await User.findById(req.user.id);
            const postOfUser = user.posts;
            postOfUser.push(post);
            user.save();
            // Emit event
            req.emit("Addpost", post);
            // const posts = await Post.find();
            // client.set("post", JSON.stringify(posts));
            return res.json({status: "create success", data: post});
        } catch (err) {
            res.status(500).send({msg: err.message});
        }
    }
);

// function to convert second into	hh:mm:ss
function secondsToHms(d) {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor((d % 3600) / 60);
    var s = Math.floor((d % 3600) % 60);

    return (
        (h > 0 ? h + ":" + (m < 10 ? "0" : "") : "") +
        m +
        ":" +
        (s < 10 ? "0" : "") +
        s
    );
}

const uploadAudioTranscribe = multer({dest: "files/transcribe/"});

app.post(
    "/api/onelanguagetranscribe",
    uploadAudioTranscribe.single("file"),
    async (req, res) => {
        try {
            const file = req.file;
            const fileAudio = fs.readFileSync(file.path);

            const {language, numSpeakers} = req.body;

            const fileCredentials = fs.readFileSync(
                process.env.GOOGLE_APPLICATION_CREDENTIALS
            );

            const client = new speech.SpeechClient({
                credentials: JSON.parse(fileCredentials),
            });

            const diarizationConfig = {
                enableSpeakerDiarization: true,
                maxSpeakerCount: numSpeakers,
            };

            const config = {
                encoding: "LINEAR16",
                sampleRateHertz: 48000,
                languageCode: language,
                audioChannelCount: 1,
                diarizationConfig: diarizationConfig,
                model: "default",
            };

            // local file read fs

            const audioBytes = fileAudio.toString("base64");
            const audio = {
                content: audioBytes,
            };

            const request = {
                config: config,
                audio: audio,
            };

            const [response] = await client.recognize(request);
            await unlinkFile(file.path);
            console.log("response: ", response);

            if (response.results.length == 0) {
                return res.json({status: "error", data: "No speech detected"});
            }

            const words = response.results[response.results.length - 1];
            const wordsInfo = words.alternatives[0].words;

            let currentSpeaker = "";
            let sentence = "";
            const resultLength = wordsInfo.length;
            let count = 0;
            let startTime = "";

            let transcriptionDiarization = [];

            wordsInfo.forEach((a) => {
                if (currentSpeaker == "") {
                    currentSpeaker = a.speakerTag;
                    startTime = secondsToHms(a.startTime.seconds);
                    sentence += a.word + " ";
                    count += 1;

                    if (count == resultLength) {
                        const obj = {
                            speaker: currentSpeaker,
                            time: startTime,
                            sentence: sentence,
                        };

                        transcriptionDiarization.push(obj);
                    }
                } else if (currentSpeaker !== a.speakerTag) {
                    startTime = secondsToHms(a.startTime.seconds);

                    console.log(
                        `speaker: ${currentSpeaker}, time: ${startTime}, sentence: ${sentence} \n`
                    );

                    currentSpeaker = a.speakerTag;
                    sentence = "";
                    count += 1;
                } else {
                    sentence += a.word + " ";
                    count += 1;

                    if (count == resultLength) {
                        const obj = {
                            speaker: currentSpeaker,
                            time: startTime,
                            sentence: sentence,
                        };

                        transcriptionDiarization.push(obj);
                    }
                }
            });

            return res.send({
                status: "success",
                transcriptionDiarization,
            });
        } catch (err) {
            res.status(500).send({msg: err.message});
        }
    }
);

http.listen(config.BASE.PORT, () => {
    console.log("server is running at", config.HttpUrl);
});
