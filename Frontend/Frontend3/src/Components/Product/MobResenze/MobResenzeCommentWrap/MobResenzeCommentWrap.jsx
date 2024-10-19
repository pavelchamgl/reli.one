import { useSelector } from "react-redux";

import MobResenzeCommentItem from "../MobResenzeCommentItem/MobResenzeCommentItem";

import styles from "./MobResenzeCommentWrap.module.scss";

const MobResenzeCommentWrap = () => {
  const comments = useSelector((state) => state.comment.comments);

  if (comments) {
    return (
      <div className={styles.main}>
        {comments.map((item) => (
          <MobResenzeCommentItem key={item.id} data={item} />
        ))}
        {/* <MobResenzeCommentItem url={true} />
        <MobResenzeCommentItem /> */}
      </div>
    );
  }
};

export default MobResenzeCommentWrap;
