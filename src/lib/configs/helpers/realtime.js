import Pusher from 'pusher-js'

const pusher = new Pusher('6730a511a20dd9b96d74', { cluster: 'ap1' });

export default pusher