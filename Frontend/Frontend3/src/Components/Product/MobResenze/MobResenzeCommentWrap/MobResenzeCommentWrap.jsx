import MobResenzeCommentItem from "../MobResenzeCommentItem/MobResenzeCommentItem";

import styles from "./MobResenzeCommentWrap.module.scss";

const MobResenzeCommentWrap = () => {
  return (
    <div className={styles.main}>
      <MobResenzeCommentItem />
      <MobResenzeCommentItem url={true} />
      <MobResenzeCommentItem />
    </div>
  );
};

export default MobResenzeCommentWrap;
