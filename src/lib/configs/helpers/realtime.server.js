import Pusher from "pusher";

const pusherServer = new Pusher({
	appId: process.env.PUSHER_APPID3,
	key: process.env.PUSHER_KEY3,
	secret: process.env.PUSHER_SECRET3,
	cluster: process.env.PUSHER_CLUSTER3,
	useTLS: true
});

export default pusherServer