import ChatBubbleIcon from '@material-ui/icons/ChatBubble';
import { ShowGuesser } from 'react-admin';
import CommentCreate from './CommentCreate';
import CommentEdit from './CommentEdit';
import CommentList from './CommentList';

export default {
  list: CommentList,
  create: CommentCreate,
  edit: CommentEdit,
  show: ShowGuesser,
  icon: ChatBubbleIcon,
};
