import { useTranslation } from "react-i18next";
import { useState } from "react";

import Container from "../ui/Container/Container";

import styles from "../styles/RegRulesPage.module.scss";

const RegRulesPage = () => {
  const [section, setSection] = useState("weAre");

  const { t } = useTranslation();
  return (
    <Container>
      <div className={styles.main}>
        <p className={styles.title}>Complaints Procedure</p>
        <div className={styles.container}>
          <div className={styles.linkDivForBuy}>
            <a
              style={{ color: section === "general" ? "#3f7f6d" : "#000" }}
              className={styles.linkItem}
              onClick={() => setSection("general")}
              href="#general"
            >
              1. General Provisions
            </a>
            <a
              style={{ color: section === "warranty" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("warranty")}
              className={styles.linkItem}
              href="#warranty"
            >
              2. Warranty for Quality
            </a>
            <a
              className={styles.linkItem}
              href="#conditions"
              style={{ color: section === "conditions" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("conditions")}
            >
              3. Warranty Conditions
            </a>
            <a
              className={styles.linkItem}
              href="#handing"
              style={{ color: section === "handing" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("handing")}
            >
              4. Handling Complaints
            </a>
            <a
              className={styles.linkItem}
              href="#provisions"
              style={{ color: section === "provisions" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("provisions")}
            >
              5. General Provisions
            </a>
            <a
              className={styles.linkItem}
              href="#min"
              style={{ color: section === "min" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("min")}
            >
              6. Consumables and Minimum Lifespan
            </a>
          </div>

          <div className={styles.paragDiv}>
            <h4 className={styles.textTitle} id="general">
              General Provisions
            </h4>
            <p className={styles.textDesc}>
              The Complaints Procedure is an integral part of the General Terms
              and Conditions of the seller Reli Group s.r.o, Company ID: 280 03
              896, with its registered office at Na lysinách 551/34, 147 00
              Prague 4, registered in the Commercial Register maintained by the
              Municipal Court in Prague, file no. C 361093 (hereinafter referred
              to as the "seller" or "Reli Group"), and describes the procedure
              for handling complaints regarding goods purchased from Reli Group.
              <br />
              <span>
                The buyer is obliged to familiarize themselves with the
                Complaints Procedure and the General Terms and Conditions
                (hereinafter "GTC") before ordering goods. The buyer also
                acknowledges that they are required to provide Reli Group with
                the necessary cooperation for processing the complaint;
                otherwise, the time limits are adequately extended by the time
                during which the buyer did not provide the required cooperation.
              </span>
              <br />
              <span>
                By concluding the purchase contract and accepting the goods from
                the seller, the buyer agrees to this Complaints Procedure.
              </span>
              <br />
              <span>
                Definitions contained in this Complaints Procedure take
                precedence over definitions in the GTC. If this Complaints
                Procedure does not define a term, it is understood in the sense
                defined in the GTC. If it is not defined there either, it is
                understood in the sense in which it is used in legal
                regulations.
              </span>
              <br />
              <span>
                In case of claiming service under a purchased or agreed service,
                this service intervention is governed exclusively by the terms
                of the respective service.
              </span>
            </p>
          </div>

          <div className={styles.paragDiv}>
            <h4 className={styles.textTitle} id="warranty">
              Warranty for Quality
            </h4>
            <p className={styles.textDesc}>
              As proof of the warranty, Reli Group issues a document of purchase
              (invoice) for each purchased item, containing legally required
              details necessary for claiming the warranty (especially the name
              of the goods, length of the warranty, price, quantity, serial
              number).
              <br />
              <span>
                At the express request of the buyer, Reli Group provides a
                warranty in the form of a warranty certificate. However,
                usually, if the nature of the item allows it, the seller issues
                a proof of purchase instead of a warranty certificate containing
                the specified details.
              </span>
              <br />
              <span>
                If required for the provided warranty, Reli Group will clearly
                explain the content of the warranty in the warranty certificate,
                stating its scope, conditions, duration, and the way claims can
                be made. The warranty certificate will also state that providing
                the warranty does not affect the buyer's rights related to the
                purchase of the item
              </span>
              <span style={{ fontWeight: "400", margin: "15px" }}>
                1. Period for Exercising Rights from Defective Performance
              </span>
              <br />
              <span>
                The period for exercising rights from defective performance
                starts from the day the buyer takes over the goods, i.e., the
                day indicated on the proof of purchase or warranty certificate.
              </span>
              <br />
              <span>
                The period is:
                <br />
                <ul>
                  <li>- 24 months for new (including unpacked) goods; -</li>
                  <li>
                    - 21 months for almost new goods (almost new goods are used
                    goods that have been checked by our specialists and marked
                    as such);
                  </li>
                  <li>
                    - 12 months for used goods (used goods are those marked as
                    used or serviced without defect, and the completeness of the
                    package does not prevent full use of the product);
                  </li>
                  <li>
                    - 12 months for refurbished goods (refurbished goods are
                    those marked "refurbished" and have undergone a service
                    intervention by our specialists).
                  </li>
                </ul>
              </span>
              <br />
              <span>
                For consumable goods (e.g., cosmetics, toiletries, etc.), the
                buyer is entitled to exercise the right from defect within
                twenty-four (24) months unless an expiration date is indicated
                on the goods, in which case the period is shortened only to the
                date indicated on the packaging.
              </span>
              <br />
              <span>
                The period ends on the corresponding date, which numerically
                matches the start date. The length of the period in months is
                indicated for each product in the seller's store and is
                sufficiently marked on the proof of purchase.
              </span>
              <br />
              <span>
                Rights from liability for defects in goods, for which a quality
                warranty applies, expire if not exercised within the specified
                period. In the case of resolving a complaint by replacing the
                goods, a new period does not start; the decisive period is the
                one starting from the day the buyer takes over the goods.
              </span>
              <span style={{ fontWeight: "400", margin: "15px" }}>
                2. Rights from Defective Performance
              </span>
              <br />
              <span>
                If the item has a defect, the buyer can request its removal.
                According to their choice, they can request the delivery of a
                new item without defects or the repair of the item unless the
                chosen method of defect removal is impossible or
                disproportionately costly compared to the other, considering the
                significance of the defect, the value the item would have
                without the defect, and whether the defect can be removed in
                another way without significant difficulties for the buyer.
              </span>
              <br />
              <span>
                The seller may refuse to remove the defect if it is impossible
                or disproportionately costly, particularly considering the
                significance of the defect and the value the item would have
                without the defect.
              </span>
              <br />
              <span>
                The buyer can request a reasonable discount or withdraw from the
                contract if:
                <ul>
                  <li>
                    a) the seller refused to remove the defect or did not remove
                    it in accordance with § 2170 (1) and (2);
                  </li>
                  <li>b) the defect appears repeatedly;</li>
                  <li>
                    c) the defect is a substantial breach of the contract; or
                  </li>
                  <li>
                    d) it is clear from the seller's statement or the
                    circumstances that the defect will not be removed within a
                    reasonable time or without significant difficulties for the
                    buyer.
                  </li>
                </ul>
              </span>
              <br />
              <span>
                A reasonable discount is determined as the difference between
                the value of the item without the defect and the defective item
                received by the buyer.
              </span>
              <br />
              <span>
                If the buyer withdraws from the contract, the seller will return
                the purchase price to the buyer without undue delay after
                receiving the item or after the buyer proves that the item has
                been sent.
              </span>
              <br />
              <span style={{ fontWeight: "400", margin: "15px" }}>
                3. Quality upon Acceptance
              </span>
              <br />
              <span>
                The seller is responsible to the buyer that the item is without
                defects upon acceptance. Specifically, the seller is responsible
                that at the time the buyer took over the item:
                <ul>
                  <li>
                    - The item has properties that the parties agreed on, and if
                    such an agreement is missing, properties that the seller or
                    manufacturer described or that the buyer expected given the
                    nature of the goods and based on the advertising they
                    conducted.
                  </li>
                  <li>
                    - The item is suitable for the purpose the seller states for
                    its use or for which an item of this kind is usually used.
                  </li>
                  <li>
                    - The item is in the corresponding quantity, measure, or
                    weight.
                  </li>
                  <li>
                    - The item complies with the requirements of legal
                    regulations.
                  </li>
                </ul>
              </span>
              <br />
              <span>
                If a defect appears within one year of acceptance, it is assumed
                that the item was defective upon acceptance unless the seller
                proves otherwise.
              </span>
              <br />
              <span style={{ fontWeight: "400", margin: "15px" }}>
                4. Contractual Warranty for Quality
              </span>
              <span>
                Beyond the legal period (24 months), Reli Group may provide free
                service within the indicated period, governed exclusively by
                this Complaints Procedure and especially by the free service,
                see Article VII. This free service does not mean the same as the
                paid "Extended Warranty" service, the conditions of which are
                governed exclusively by the conditions of that service.
              </span>
            </p>
          </div>

          <div id="conditions" className={styles.paragDiv}>
            <h4 className={styles.textTitle}>Warranty Conditions:</h4>
            <p className={styles.textDesc}>
              <span style={{ fontWeight: "400", margin: "15px" }}>
                1. Inspection of Goods upon Acceptance
              </span>
              <br />
              <span>
                The buyer inspects the goods, its completeness, and the
                integrity of the packaging during personal acceptance from the
                seller.
              </span>
              <br />
              <span>
                When accepting from the carrier, the buyer thoroughly inspects
                the condition of the shipment (especially the number of
                packages, the integrity of the company tape with the logo, the
                integrity or damage to the packaging) according to the delivery
                note.
              </span>
              <br />
              <span>
                The buyer further inspects the completeness of the goods on the
                day of acceptance, particularly ensuring that the packaging
                contains everything it should.
              </span>
              <br />
              <span>
                Any discrepancies must be reported to the seller during personal
                acceptance onsite, marked in the carrier's delivery protocol
                when accepting from the carrier, or the buyer can refuse to
                accept the shipment, or it can always be reported via email
                <a
                  style={{
                    color: "#047857",
                    textDecoration: "none",
                    padding: "0 5px",
                  }}
                  href="#"
                >
                  rek.reli7772@gmail.com.
                </a>
                Additionally, Reli Group recommends attaching photographic
                documentation of the damage and packaging in case of acceptance
                from the carrier.
              </span>
              <br />
              <span>
                These provisions do not affect the statutory period for
                exercising rights from defective performance. Subsequent
                complaints about incompleteness or external damage to the
                shipment do not deprive the buyer of the right to claim, but
                they give Reli Group the opportunity to prove that it is not a
                discrepancy with the purchase contract.
              </span>
              <br />
              <span style={{ fontWeight: "400", margin: "15px" }}>
                2. Submitting a Complaint
              </span>
              <br />
              <span>
                Reli Group recommends submitting a complaint at an authorized
                service center for faster processing if available for the type
                of goods in question. The list of authorized service centers can
                be found here.
              </span>
              <br />
              <span>
                For large appliances (washing machines, refrigerators, stoves,
                built-in appliances), it is recommended to complain through the
                authorized service center, which will ensure service at your
                home.
              </span>
              <br />
              <span style={{ fontWeight: "400", margin: "15px" }}>
                3. Compatibility
              </span>
              <span>
                Reli Group does not guarantee full compatibility of sold
                components with other components not approved by Reli Group
                employees, the manufacturer, or the supplier, nor with software
                applications whose functionality was not expressly requested by
                the buyer in a written order, unless such compatibility is usual
                for similar goods and it was not explicitly stated by Reli Group
                that the goods are compatible only with the listed items or are
                incompatible only with the listed items.
              </span>
              <br />
              <span>
                This also applies similarly to software and its individual
                versions. Additionally, if the compatibility of certain software
                versions was declared, this does not automatically apply to
                their subsequent or preceding versions.
              </span>
              <br />
              <span style={{ fontWeight: "400", margin: "15px" }}>
                4. Exclusions
              </span>
              <br />
              <span>
                Tampering with protective seals, informational labels, or serial
                numbers exposes the buyer to the risk of having the warranty
                claim denied, unless the damage occurs during normal use. Seals
                and serial numbers are integral parts of the product and do not
                restrict the customer's right to use and handle the product
                fully as intended.
              </span>
              <br />
              <span>
                The warranty does not cover damages caused by (unless such
                activity is usual and not prohibited in the accompanying user
                manual):
              </span>
              <ul>
                <li>- Mechanical damage to the product,</li>
                <li>
                  - Electrical surges (visible burned components or circuit
                  boards) except for normal deviations,
                </li>
                <li>
                  - Using the product in conditions that do not match the
                  temperature, dust, humidity, chemical, and mechanical
                  influences specified by the seller or manufacturer,
                </li>
                <li>
                  - Improper installation, handling, operation, or neglecting
                  product care,
                </li>
                <li>
                  - Damage to the product or its part by a computer virus, etc.,
                </li>
                <li>
                  - Defects occurring only in software where the customer cannot
                  prove a legal way of acquisition, or by using unauthorized
                  software and consumables,
                </li>
                <li>
                  - Damage caused by excessive load or use contrary to the
                  conditions stated in the documentation or general principles,
                </li>
                <li>
                  - Unauthorized intervention or changes in parameters
                  (unauthorized intervention is understood as any intervention
                  by any person other than the seller or an authorized service),
                </li>
                <li>
                  - Products that have been modified by the customer (painting,
                  bending, etc.), if the defect arose as a result of this
                  modification,
                </li>
                <li>- Improper BIOS or firmware upgrade,</li>
                <li>- Damage by natural disasters or force majeure,</li>
                <li>- Use of incorrect or defective software,</li>
                <li>
                  - Use of incorrect or non-original consumables, and any
                  damages resulting from it, unless such use is usual and not
                  excluded in the accompanying user manual.
                </li>
              </ul>
              <span>
                These limitations do not apply if the properties of the goods,
                contrary to the above conditions, were expressly agreed upon,
                reserved, or declared by the buyer and Reli Group, or can be
                expected due to advertising or usual usage.
              </span>
              <br />
              <span style={{ fontWeight: "400", margin: "15px" }}>
                5. Testing of Defect
              </span>
              <br />
              <span>
                Goods submitted for a warranty claim will be tested only for the
                defect specified by the buyer (in the warranty claim form, in
                the attached description of the defect). Reli Group recommends a
                written form for specifying the defect, which also includes
                electronic communication.
              </span>
              <br />
              <span>
                If the warranty claim is denied and the buyer agrees to a paid
                repair, the repair will be charged according to the current
                price list of the authorized service center.
              </span>
              <br />
              <span>
                The buyer acknowledges that Reli Group does not perform paid
                repairs but only mediates them with authorized service centers
                or ensures communication and transportation with them. Reli
                Group is not responsible for the execution of the repair.
              </span>
              <br />
              <span>
                Before performing a paid repair, the buyer will be informed of
                the repair cost, its scope, and the time required for its
                completion. The repair will be performed no later than 60 days
                from the day following the acceptance of the goods by Reli
                Group. Paid repairs will only be carried out with the express
                consent of the buyer (or based on a concluded service contract)
                given after the aforementioned information.
              </span>
              <br />
              <span style={{ fontWeight: "400", margin: "15px" }}>
                6. Data Backup
              </span>
              <br />
              <span>
                When handing over a computer system or data storage device for a
                warranty claim or repair, the buyer must secure an appropriate
                backup of the necessary data and prevent possible misuse or
                damage to them. Reli Group is not responsible for any loss,
                damage, or misuse of data stored on data storage devices in the
                computer system.
              </span>
              <br />
              <span>
                Data storage devices are devices whose failure rate is an
                objective phenomenon with random failure occurrence. Reli Group
                hereby informs the buyer of this fact and recommends systematic
                backing up of user data on suitable devices. However, the
                warranty on the goods is not limited by this notification.
              </span>
              <br />
              <span>
                The buyer acknowledges that if a warranty claim is resolved by
                replacing the data storage device, the original device will not
                be returned.
              </span>
              <br />
              <span style={{ fontWeight: "400", margin: "15px" }}>
                7. Warranty Denial
              </span>
              <br />
              <span>A. For Dirty Goods</span>
              <br />
              <span style={{ margin: "20px 0" }}>
                Reli Group has the right to deny a warranty claim if the claimed
                goods and/or its parts are dirty or do not meet the basic
                requirements for hygienically safe handling of the goods for the
                warranty process. In the case of a device with a fuel tank, the
                tank must be empty at the time of receiving the claim.
              </span>
              <span>B. For Device Security</span>
              <br />
              <span style={{ margin: "20px 0" }}>
                If access to the device is protected by a password, gesture, or
                other access security, the buyer is obligated to remove this
                protection or provide the password in the defect description
                when making a warranty claim. Otherwise, Reli Group has the
                right to deny the claim. The same applies if the BIOS or
                firmware of the device or access to the device's storage is
                protected in this manner. Without full access to the device,
                repair or diagnosis may not be possible.
              </span>
              <span>
                If any service that secures the device against theft is
                activated on the device, the buyer must deactivate this service
                before making a warranty claim. Otherwise, Reli Group has the
                right to deny the claim. This applies to services like Apple
                Find My iPhone, iPod touch, MacBook, Intel anti-theft, and
                others.
              </span>
              <span style={{ fontWeight: "400", margin: "15px" }}>
                8. Factory Configuration, Modifications Made by the Buyer
              </span>
              <span>
                The buyer is hereby informed to ensure that the device submitted
                for a warranty claim is in factory configuration. This
                particularly concerns added or replaced RAM, hard drives, or
                SSDs in notebooks and computers. The seller bears no
                responsibility for such attached parts, especially if they are
                not explicitly stated in the claim receipt.
              </span>
              <span>
                Original components should be retained for possible warranty
                claims, particularly for contract rescission.
              </span>
              <span>
                If the buyer submits goods for a warranty claim that are not in
                factory configuration, i.e., modified by the buyer or at the
                buyer's request, the buyer acknowledges that service
                intervention may invalidate such modification without
                compensation. In case of modifications, the buyer should retain
                original components.
              </span>
              <span>
                A modification by the buyer means, for example:
                <ul>
                  <li>
                    a) Added or replaced RAM, hard drives, or SSDs in notebooks
                    and computers
                  </li>
                  <li>
                    b) Application of foil or protective glass on a phone or
                    similar device, application of skin or sticker on the
                    device, patch on clothing, and similar modifications.
                  </li>
                </ul>
              </span>
            </p>
          </div>

          <div id="handing" className={styles.paragDiv}>
            <h4 className={styles.textTitle}>Handling Complaints</h4>
            <p className={styles.textDesc}>
              <span>
                The seller will decide on the complaint immediately, in
                complicated cases within three working days. This period does
                not include the time necessary for the type of product or
                service required for expert assessment of the defect.
              </span>
              <span>
                Reli Group will handle the complaint, including the removal of
                the defect, without undue delay, no later than 30 days from the
                day following the complaint submission. The 30-day period can be
                extended upon agreement with the buyer, but such an extension
                cannot be indefinite or excessively long. After the period, or
                the extended period, has expired, it is assumed that the defect
                on the item indeed existed, and the buyer has the same rights as
                if it were a defect that cannot be removed.
              </span>
            </p>
          </div>

          <div id="provisions" className={styles.accountInfoDiv}>
            <h4 className={styles.textTitle}>General Provisions</h4>
            <p className={styles.textDesc}>
              <span>
                Reli Group will issue the buyer a written confirmation of the
                date and method of complaint resolution, including confirmation
                of the repair and the duration of the complaint process, or a
                justification for the rejection of the complaint.
              </span>
              <span>
                After resolving the complaint, Reli Group will inform the buyer
                about the resolution either by phone, SMS, or email. If the
                goods were sent by a carrier, they will be automatically sent
                back to the buyer's address after resolution.
              </span>
              <span>
                After handling an acknowledged complaint through repair or
                replacement, the warranty period of the device is extended by
                the duration of the complaint process. The duration of the
                complaint is calculated from the day following the submission
                until the day the buyer was informed about the resolution.
              </span>
              <span>
                The buyer has the right to reimbursement of reasonably incurred
                costs associated with making a justified complaint. These costs
                are understood as the minimum necessary, primarily the postage
                for sending the complaint. These costs do not include traveling
                by car to make a complaint or express delivery and similar
                services. Reimbursement of costs must be requested without undue
                delay, but no later than one month after the end of the period
                for exercising rights from defective performance.
              </span>
              <span>
                The buyer is obliged to check the received goods and their
                compliance with the complaint delivery protocol. The buyer must
                also check the completeness of the goods, ensuring that the
                package contains everything it should. Later objections will not
                be considered.
              </span>
              <span>
                These provisions do not affect the statutory period for
                exercising rights from defective performance.
              </span>
              <span>
                The buyer must pick up the complaint without undue delay within
                30 days from the day they were informed about the resolution.
                This period cannot end earlier than 60 days from the complaint
                submission.
              </span>
              <span>
                If the buyer does not pick up the complaint by the last day of
                the period, the seller will charge a storage fee of 2 Euros
                including VAT for each day of delay after the period expires.
              </span>
              <span>
                If the buyer does not collect the goods from the resolved
                complaint within two months from the day they were informed
                about the resolution, Reli Group reserves the right to sell the
                goods and use the proceeds to cover the storage fee.
              </span>
              <span>
                When collecting goods or cashing in a credit note in person
                after the complaint resolution, the buyer must present the
                document on which the item was accepted for the complaint and
                prove their identity with a valid ID (ID card, passport) to
                prevent damages and money laundering. Without presenting one of
                these documents, Reli Group or its contractual partner may
                refuse to hand over the goods or cash the credit note. If the
                buyer is a legal entity, the goods or credit note will only be
                handed over to the statutory body of the legal entity or a
                person with a verified power of attorney.
              </span>
            </p>
          </div>

          <div id="min" className={styles.accountInfoDiv}>
            <h4 className={styles.textTitle}>
              Consumables and Minimum Lifespan
            </h4>
            <p className={styles.textDesc}>
              <span>
                If the subject of the purchase is consumable material (e.g.,
                cartridges, toner, print head, print drum, projector lamp,
                batteries, various types of lighting, etc.) or if this material
                is part of the purchased goods, the lifespan applies instead of
                the quality warranty. The lifespan can be specified by time,
                product usage, number of uses, number of printed pages, or
                similarly. There may be more than one such lifespan for a
                product. To successfully claim a warranty, all specified
                conditions must be met.
              </span>
              <span>
                The buyer's right to complain about goods within the statutory
                warranty period is not affected. However, the buyer must
                consider the above facts, as the warranty does not cover wear
                and tear caused by normal use, and it should not be confused
                with the product's lifespan. The lifespan represents the
                susceptibility to wear and tear caused by normal use. If you use
                (not just own) the product longer than its usual lifespan, it is
                likely that the defect is due to normal wear and tear, though it
                is not excluded that it is a warranty defect
              </span>
            </p>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default RegRulesPage;
